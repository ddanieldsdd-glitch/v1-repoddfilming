import defaultContent from "../data/content.json";
import { defaultWorkCrop } from "./crop";

const STORAGE_KEY = "ddp_content_v7";
const LANG_KEY = "ddp_lang";
const ADMIN_AUTH_KEY = "ddp_admin_auth";

const listeners = new Set();

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
        preview_crop:
          p.preview_crop ?? p.work_crop ?? def?.preview_crop ?? def?.work_crop ?? defaultWorkCrop(),
      };
    }),
  };
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
  return applyHomeDefaults(await res.json());
};

// Update localStorage cache and notify all subscribers (local only, no server write)
export const saveContent = (next) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn(next));
};

// Write to server via PUT, then update cache on success
export const pushContent = async (next) => {
  const res = await fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(next),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  saveContent(next);
  return next;
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
