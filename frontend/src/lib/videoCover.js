import { normalizeCrop } from "./crop";
import { DEFAULT_VIDEO_RATIO } from "./vimeoMeta";

export { DEFAULT_VIDEO_RATIO };

export const resolveVideoRatio = (previewVideoRatio) => {
  const ratio = Number(previewVideoRatio);
  if (!Number.isFinite(ratio) || ratio <= 0) return DEFAULT_VIDEO_RATIO;
  return ratio;
};

export const computeCoverScale = (videoRatio, containerRatio) => {
  const video = Number(videoRatio);
  const container = Number(containerRatio);
  if (!Number.isFinite(video) || video <= 0) return 1;
  if (!Number.isFinite(container) || container <= 0) return 1;
  return Math.max(video / container, container / video);
};

export const computeCropZoom = (crop) => {
  if (!crop) return 1;
  const normalized = normalizeCrop(crop);
  const minSide = Math.min(normalized.w, normalized.h);
  if (!Number.isFinite(minSide) || minSide <= 0) return 1;
  return 1 / minSide;
};

export const computeVideoCoverVars = ({
  previewVideoRatio,
  containerRatio,
  crop,
}) => {
  const videoRatio = resolveVideoRatio(previewVideoRatio);
  const coverScale = computeCoverScale(videoRatio, containerRatio);
  const cropZoom = computeCropZoom(crop);
  const normalized = crop ? normalizeCrop(crop) : null;
  const hasCrop = normalized && !(normalized.w >= 0.99 && normalized.h >= 0.99 && normalized.x <= 0.01 && normalized.y <= 0.01);

  return {
    "--vf-cover-w": String(Math.max(1, videoRatio / containerRatio)),
    "--vf-cover-h": String(Math.max(1, containerRatio / videoRatio)),
    "--vf-zoom": String(coverScale * cropZoom),
    ...(hasCrop
      ? {
          "--vf-x": `${(normalized.x + normalized.w / 2) * 100}%`,
          "--vf-y": `${(normalized.y + normalized.h / 2) * 100}%`,
        }
      : {}),
  };
};
