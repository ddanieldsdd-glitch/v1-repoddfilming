import { getVimeoPosterUrl } from "../../../lib/vimeo";
import { stillChoices } from "../../../lib/homeGrid";
import { isVimeoUrl } from "../../../lib/vimeoMeta";

export const projectVimeoPreview = (project) => {
  const raw = project?.preview_url || (isVimeoUrl(project?.cover) ? project.cover : "");
  return raw && isVimeoUrl(raw) ? raw : "";
};

export const previewCropGuideUrl = (project) => {
  const vimeo = projectVimeoPreview(project);
  const thumb = vimeo ? getVimeoPosterUrl(vimeo) : null;
  if (thumb) return thumb;
  if (project?.poster) return project.poster;
  if (project?.stills?.[0]) return project.stills[0];
  if (project?.cover && !isVimeoUrl(project.cover)) return project.cover;
  return stillChoices(project)[0] || "";
};
