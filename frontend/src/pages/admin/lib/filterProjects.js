import { isVimeoUrl } from "../../../lib/vimeoMeta";

const needsRatio = (project) =>
  isVimeoUrl(project.preview_url) &&
  !(typeof project.preview_video_ratio === "number" && project.preview_video_ratio > 0);


export const filterProjects = (projects, { query = "", status = "all", category = "all", homeOnly = false, ratioOnly = false, sort = "position" } = {}) => {
  const q = query.trim().toLowerCase();
  let list = (projects || []).map((project, index) => ({ project, index }));
  if (status === "published") list = list.filter(({ project }) => project.published !== false);
  if (status === "draft") list = list.filter(({ project }) => project.published === false);
  if (category !== "all") list = list.filter(({ project }) => project.category === category);
  if (homeOnly) list = list.filter(({ project }) => project.home_featured !== false);
  if (ratioOnly) list = list.filter(({ project }) => needsRatio(project));
  if (q) {
    list = list.filter(({ project }) =>
      [project.title, project.slug, project.director, project.category, String(project.year)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (sort === "title") list = [...list].sort((a, b) => String(a.project.title).localeCompare(b.project.title));
  if (sort === "year") list = [...list].sort((a, b) => Number(b.project.year) - Number(a.project.year));
  return list;
};

export const canReorderProjects = ({ query = "", homeOnly = false, ratioOnly = false, sort = "position" } = {}) =>
  sort === "position" && !String(query || "").trim() && !homeOnly && !ratioOnly;

/** Swap adjacent items in a visible subsequence; other slots stay put. */
export const swapAdjacentInSubsequence = (projects, visibleIds, visibleIndex, dir) => {
  const ids = (projects || []).map((project) => project.id);
  const j = visibleIndex + dir;
  if (visibleIndex < 0 || j < 0 || j >= visibleIds.length) return ids;
  const nextVisible = [...visibleIds];
  [nextVisible[visibleIndex], nextVisible[j]] = [nextVisible[j], nextVisible[visibleIndex]];
  const queue = [...nextVisible];
  const visibleSet = new Set(visibleIds);
  return ids.map((id) => (visibleSet.has(id) ? queue.shift() : id));
};
