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
