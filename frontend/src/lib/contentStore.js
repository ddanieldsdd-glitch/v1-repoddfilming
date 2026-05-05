import defaultContent from "../data/content.json";

const STORAGE_KEY = "ddp_content_v7";
const LANG_KEY = "ddp_lang";
const ADMIN_AUTH_KEY = "ddp_admin_auth";

// CRA solo expone variables con prefijo REACT_APP_. Configura REACT_APP_ADMIN_PASSWORD en Vercel (.env local para desarrollo).
export const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || "";

export const isAdminLoginConfigured = () =>
  typeof ADMIN_PASSWORD === "string" && ADMIN_PASSWORD.length > 0;

const listeners = new Set();

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const loadContent = () => {
  if (typeof window === "undefined") return defaultContent;
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  return parsed || defaultContent;
};

export const saveContent = (next) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn(next));
};

export const resetContent = () => {
  localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((fn) => fn(defaultContent));
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

// Returns only the categories that have at least one project.
// Empty categories are hidden everywhere on the public site.
export const getActiveCategories = (projects = []) =>
  CATEGORIES.filter((c) => projects.some((p) => p.category === c.id));

export const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const newProjectId = () =>
  "p-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);


