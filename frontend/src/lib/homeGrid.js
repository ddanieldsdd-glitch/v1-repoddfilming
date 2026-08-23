/** Cómo empaqueta cada pieza en la parrilla justificada (el frame nunca se recorta). */
export const HOME_SIZES = [
  { id: "hero", es: "Destacado — en fila", en: "Featured — packed" },
  { id: "large", es: "Grande — en fila", en: "Large — packed" },
  { id: "wide", es: "Panorámica — en fila", en: "Wide — packed" },
  { id: "tall", es: "En fila (vertical)", en: "Packed (vertical)" },
  { id: "medium", es: "En fila", en: "Packed in a row" },
  { id: "small", es: "En fila (compacto)", en: "Packed compact" },
];

const AUTO_SIZES = ["medium", "medium", "large", "medium", "wide", "medium", "tall", "small"];

export const HOME_SIZE_CLASS = {
  hero: "col-span-12 md:col-span-8 md:row-span-2 min-h-[58vw] md:min-h-0",
  large: "col-span-12 sm:col-span-6 md:col-span-6 md:row-span-2 min-h-[52vw] sm:min-h-[36vw] md:min-h-0",
  wide: "col-span-12 md:col-span-8 min-h-[52vw] md:min-h-0",
  tall: "col-span-12 sm:col-span-6 md:col-span-4 md:row-span-2 min-h-[72vw] sm:min-h-[48vw] md:min-h-0",
  medium: "col-span-12 sm:col-span-6 md:col-span-4 min-h-[52vw] sm:min-h-[32vw] md:min-h-0",
  small: "col-span-6 md:col-span-3 min-h-[42vw] sm:min-h-[28vw] md:min-h-0",
};

export function stillChoices(project) {
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

const THEME_PRIORITY = ["fiction", "documentary"];

export function getHomeThemeCards(projects = []) {
  const published = (projects || []).filter((p) => p.published !== false);
  const pick = (id) => {
    const inCat = published.filter((p) => p.category === id);
    return (
      inCat.find((p) => p.home_featured !== false && resolveHomeStill(p)) ||
      inCat.find((p) => resolveHomeStill(p)) ||
      inCat[0] ||
      null
    );
  };

  return THEME_PRIORITY.map((id) => {
    const project = pick(id);
    return {
      id,
      project,
      still: project ? resolveHomeStill(project) : "",
    };
  });
}
