/** Tamaños de celda en la parrilla del home (12 columnas, auto-flow dense). */
export const HOME_SIZES = [
  { id: "hero", es: "Destacado (grande)", en: "Hero" },
  { id: "large", es: "Grande", en: "Large" },
  { id: "wide", es: "Ancho", en: "Wide" },
  { id: "tall", es: "Alto (vertical)", en: "Tall" },
  { id: "medium", es: "Mediano", en: "Medium" },
  { id: "small", es: "Pequeño", en: "Small" },
];

const AUTO_SIZES = ["hero", "medium", "medium", "wide", "medium", "tall", "large", "small"];

export const HOME_SIZE_CLASS = {
  hero: "col-span-12 md:col-span-8 md:row-span-2 min-h-[58vw] md:min-h-0",
  large: "col-span-12 sm:col-span-6 md:col-span-6 md:row-span-2 min-h-[52vw] sm:min-h-[36vw] md:min-h-0",
  wide: "col-span-12 md:col-span-8 min-h-[52vw] md:min-h-0",
  tall: "col-span-12 sm:col-span-6 md:col-span-4 md:row-span-2 min-h-[72vw] sm:min-h-[48vw] md:min-h-0",
  medium: "col-span-12 sm:col-span-6 md:col-span-4 min-h-[52vw] sm:min-h-[32vw] md:min-h-0",
  small: "col-span-6 md:col-span-3 min-h-[42vw] sm:min-h-[28vw] md:min-h-0",
};

export function projectStillChoices(project) {
  const urls = [project?.cover, ...(project?.stills || [])].filter(Boolean);
  return [...new Set(urls)];
}

export function resolveHomeStill(project) {
  const chosen = String(project?.home_still || "").trim();
  if (chosen) return chosen;
  const cover = project?.cover && !/vimeo\.com|youtube\.com|youtu\.be/.test(project.cover)
    ? project.cover
    : "";
  return cover || project?.stills?.[0] || project?.poster || "";
}

export function getHomeProjects(projects = []) {
  const published = (projects || []).filter((p) => p.published !== false);
  const featured = published.filter((p) => p.home_featured !== false);

  return featured
    .map((project, index) => {
      const order = Number.isFinite(Number(project.home_order))
        ? Number(project.home_order)
        : index + 1;
      const size = HOME_SIZE_CLASS[project.home_size] ? project.home_size : AUTO_SIZES[index % AUTO_SIZES.length];
      return {
        project,
        order,
        size,
        still: resolveHomeStill(project),
        className: HOME_SIZE_CLASS[size],
      };
    })
    .sort((a, b) => a.order - b.order || a.project.title.localeCompare(b.project.title));
}
