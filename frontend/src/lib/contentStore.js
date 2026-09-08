import defaultContent from "../data/content.json";
import { defaultWorkCrop } from "./crop";

const STORAGE_KEY = "ddp_content_v8";
const LANG_KEY = "ddp_lang";
const ADMIN_AUTH_KEY = "ddp_admin_auth";

const listeners = new Set();

export class ContentConflictError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = "ContentConflictError";
    this.code = meta.code || "VERSION_CONFLICT";
    this.serverUpdatedAt = meta.serverUpdatedAt || null;
  }
}

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const applyHomeDefaults = (content) => {
  if (!content?.projects) return content;
  const defaults = defaultContent.projects || [];
  const siteDef = defaultContent.site || {};
  return {
    ...content,
    site: {
      ...siteDef,
      ...content.site,
      home_max: content.site?.home_max ?? siteDef.home_max ?? 12,
      showreel_placement: content.site?.showreel_placement ?? siteDef.showreel_placement ?? "nav",
    },
    projects: content.projects.map((p, i) => {
      const def = defaults.find((d) => d.id === p.id || d.slug === p.slug);
      return {
        ...p,
        home_featured: p.home_featured ?? def?.home_featured ?? true,
        home_order: p.home_order ?? def?.home_order ?? i + 1,
        home_size: p.home_size ?? def?.home_size ?? "medium",
        home_still: p.home_still ?? def?.home_still ?? "",
        home_still_ratio: p.home_still_ratio ?? def?.home_still_ratio ?? null,
        preview_crop:
          p.preview_crop ?? p.work_crop ?? def?.preview_crop ?? def?.work_crop ?? defaultWorkCrop(),
      };
    }),
  };
};

const mergeContentPatch = (current, patch) => applyHomeDefaults({
  ...current,
  ...patch,
  site: patch.site ? { ...current.site, ...patch.site } : current.site,
  about: patch.about ? { ...current.about, ...patch.about } : current.about,
  projects: patch.projects ?? current.projects,
});

const requestJson = async (url, options = {}) => {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) {
    throw new ContentConflictError(data.message || "Este contenido se modificó en otra sesión", {
      code: data.code,
      serverUpdatedAt: data.server_updated_at,
    });
  }
  if (res.status === 401) {
    setAdminAuthed(false);
    throw new Error("Sesión expirada");
  }
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
};

// Synchronous read from localStorage cache — used for instant first render
export const loadContent = () => {
  if (typeof window === "undefined") return applyHomeDefaults(defaultContent);
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  const base = parsed || defaultContent;
  return applyHomeDefaults({
    ...defaultContent,
    ...base,
    site: {
      ...defaultContent.site,
      ...base.site,
      meta_description: {
        ...(defaultContent.site?.meta_description || {}),
        ...(base.site?.meta_description || {}),
      },
    },
    about: { ...defaultContent.about, ...base.about },
    projects: base.projects ?? defaultContent.projects,
  });
};

// Async fetch from the server — returns fresh data from MongoDB
export const fetchContent = async () => {
  const res = await fetch("/api/content", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = applyHomeDefaults(await res.json());
  saveContent(data);
  return data;
};

// Update localStorage cache and notify all subscribers (local only, no server write)
export const saveContent = (next) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn(next));
};

const persistMerged = (current, patch) => {
  const next = mergeContentPatch(current, patch);
  saveContent(next);
  return next;
};

// Write to server via PUT, then update cache on success
export const pushContent = async (next) => {
  const data = await requestJson("/api/content", {
    method: "PUT",
    body: JSON.stringify({
      ...next,
      updated_at: next.updated_at,
    }),
  });
  const merged = persistMerged(next, {
    updated_at: data.updated_at,
    site_updated_at: data.site_updated_at,
    home_updated_at: data.home_updated_at,
  });
  return merged;
};

export const createProject = async (current, project, { position = "start" } = {}) => {
  const data = await requestJson("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      updated_at: current.updated_at,
      project,
      position,
    }),
  });
  const projects =
    position === "end"
      ? [...current.projects, data.project]
      : [data.project, ...current.projects];
  return persistMerged(current, {
    updated_at: data.updated_at,
    site_updated_at: data.site_updated_at,
    home_updated_at: data.home_updated_at,
    projects,
  });
};

export const updateProject = async (current, project) => {
  const data = await requestJson(`/api/projects/${encodeURIComponent(project.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      updated_at: project.updated_at,
      project,
    }),
  });
  return persistMerged(current, {
    updated_at: data.updated_at,
    site_updated_at: data.site_updated_at,
    home_updated_at: data.home_updated_at,
    projects: current.projects.map((item) => (item.id === data.project.id ? data.project : item)),
  });
};

export const deleteProject = async (current, project) => {
  const data = await requestJson(`/api/projects/${encodeURIComponent(project.id)}`, {
    method: "DELETE",
    body: JSON.stringify({ updated_at: project.updated_at }),
  });
  return persistMerged(current, {
    updated_at: data.updated_at,
    site_updated_at: data.site_updated_at,
    home_updated_at: data.home_updated_at,
    projects: current.projects.filter((item) => item.id !== project.id),
  });
};

export const reorderProjects = async (current, order) => {
  const data = await requestJson("/api/projects/reorder", {
    method: "PUT",
    body: JSON.stringify({
      updated_at: current.updated_at,
      order,
    }),
  });
  const byId = new Map(current.projects.map((project) => [project.id, project]));
  const projects = (data.order || order).map((id) => byId.get(id)).filter(Boolean);
  return persistMerged(current, {
    updated_at: data.updated_at,
    site_updated_at: data.site_updated_at,
    home_updated_at: data.home_updated_at,
    projects,
  });
};

export const updateSite = async (current, { site, about }) => {
  const data = await requestJson("/api/site", {
    method: "PUT",
    body: JSON.stringify({
      site_updated_at: current.site_updated_at,
      site,
      about,
    }),
  });
  return persistMerged(current, {
    updated_at: data.updated_at,
    site_updated_at: data.site_updated_at,
    home_updated_at: data.home_updated_at,
    site: data.site,
    about: data.about,
  });
};

export const updateHomeLayout = async (
  current,
  { home_max, projects, showreel_url, showreel_placement },
) => {
  const data = await requestJson("/api/home-layout", {
    method: "PUT",
    body: JSON.stringify({
      home_updated_at: current.home_updated_at,
      home_max,
      showreel_url,
      showreel_placement,
      projects,
    }),
  });
  return persistMerged(current, {
    updated_at: data.updated_at,
    site_updated_at: data.site_updated_at,
    home_updated_at: data.home_updated_at,
    site: data.site,
    projects: data.projects,
  });
};

export const resetContent = async () => {
  await pushContent(defaultContent);
};

export const subscribeContent = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getDefaultContent = () => defaultContent;

// Language
export const getLang = () => {
  if (typeof window === "undefined") return "es";
  return localStorage.getItem(LANG_KEY) || "es";
};

export const setLang = (lang) => {
  localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new CustomEvent("ddp-lang-change", { detail: lang }));
};

// Admin auth (session)
export const isAdminAuthed = () =>
  typeof window !== "undefined" &&
  sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";

export const setAdminAuthed = (val) => {
  if (val) sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
  else sessionStorage.removeItem(ADMIN_AUTH_KEY);
};

export const logoutAdmin = async () => {
  try {
    await fetch("/api/admin-logout", { method: "POST", credentials: "same-origin" });
  } catch {
    /* ignore */
  }
  setAdminAuthed(false);
};

export const verifyAdminSession = async () => {
  const res = await fetch("/api/admin-session", { credentials: "same-origin" });
  return res.ok;
};

export const CATEGORIES = [
  { id: "fiction", es: "Ficción", en: "Fiction" },
  { id: "documentary", es: "Documental", en: "Documentary" },
  { id: "commercial", es: "Publicidad", en: "Commercials" },
  { id: "music-video", es: "Videoclips", en: "Music Videos" },
];

// Returns only categories that have at least one published project
export const getActiveCategories = (projects = []) =>
  CATEGORIES.filter((c) =>
    projects.some((p) => p.category === c.id && p.published !== false)
  );

export const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const newProjectId = () =>
  "p-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
