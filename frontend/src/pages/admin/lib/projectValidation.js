const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_RE = /^https?:\/\//i;
const RESERVED = new Set(["admin", "api", "work", "about", "contact", "showreel", "project"]);

export function validateProject(project, allProjects = []) {
  const errors = {};
  if (!String(project.title || "").trim()) errors.title = "El título es obligatorio";
  const slug = String(project.slug || "").trim();
  if (!slug) errors.slug = "El slug es obligatorio";
  else if (!SLUG_RE.test(slug)) errors.slug = "Usa solo minúsculas, números y guiones";
  else if (RESERVED.has(slug)) errors.slug = "Ese slug está reservado";
  else if (allProjects.some((item) => item.slug === slug && item.id !== project.id)) {
    errors.slug = "Ese slug ya está en uso";
  }
  const year = Number(project.year);
  if (project.year && (year < 1900 || year > 2100)) errors.year = "Año no válido";
  if (project.preview_url && !URL_RE.test(project.preview_url)) {
    errors.preview_url = "Introduce una URL válida";
  }
  if (project.external_link && !URL_RE.test(project.external_link)) {
    errors.external_link = "Introduce una URL válida";
  }
  return errors;
}

export function validateSite(site = {}) {
  const errors = {};
  const email = site.social?.email;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email no válido";
  const phone = site.social?.phone;
  if (phone && !/^\+?[0-9\s-]{6,}$/.test(phone)) errors.phone = "Teléfono no válido";
  return errors;
}

export { SLUG_RE };
