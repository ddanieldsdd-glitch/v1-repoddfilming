/**
 * SEO de vídeo en cliente (Vimeo + YouTube).
 * Misma lógica que api/_videoSeo.js para JSON-LD en navegación SPA.
 */

export function isVideoUrl(url) {
  return /vimeo\.com|youtube\.com|youtu\.be/i.test(String(url || ""));
}

export function parseVideoUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    const id = vimeo[1];
    return {
      provider: "vimeo",
      id,
      contentUrl: `https://vimeo.com/${id}`,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      defaultThumbnail: `https://vumbnail.com/${id}.jpg`,
    };
  }

  const yt = raw.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  if (yt) {
    const id = yt[1];
    return {
      provider: "youtube",
      id,
      contentUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      defaultThumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  return null;
}

export function getProjectVideoUrl(project) {
  if (!project) return null;
  const preview = project.preview_url && String(project.preview_url).trim();
  if (preview && isVideoUrl(preview)) return preview;
  const cover = project.cover && String(project.cover).trim();
  if (cover && isVideoUrl(cover)) return cover;
  return null;
}

export function resolveProjectVideo(project) {
  const url = getProjectVideoUrl(project);
  return url ? parseVideoUrl(url) : null;
}

function toVideoThumb(url) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  if (url.includes("/upload/w_1280")) return url;
  return url.replace("/upload/", "/upload/w_1280,h_720,c_fill,g_auto,q_auto,f_jpg/");
}

export function getProjectVideoThumbnail(project, video) {
  const cover = project?.cover && String(project.cover).trim();
  if (cover && !isVideoUrl(cover)) return toVideoThumb(cover);
  const poster = project?.poster && String(project.poster).trim();
  if (poster) return toVideoThumb(poster);
  return video?.defaultThumbnail || "";
}

export function buildProjectVideoGraph(project, pageUrl, siteName = "Dani Díaz") {
  const video = resolveProjectVideo(project);
  const description = (
    project?.synopsis?.es ||
    project?.synopsis?.en ||
    "Proyecto cinematográfico de Dani Díaz."
  ).slice(0, 500);
  const videoNodeId = video ? `${pageUrl}#video` : undefined;

  const graph = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: `${project.title} — ${siteName}`,
      description,
      inLanguage: ["es", "en"],
      author: { "@id": "https://ddanidiaz.com/#person" },
      ...(videoNodeId ? { mainEntity: { "@id": videoNodeId } } : {}),
    },
  ];

  if (video) {
    graph.push({
      "@type": "VideoObject",
      "@id": `${pageUrl}#video`,
      name: project.title,
      description,
      thumbnailUrl: getProjectVideoThumbnail(project, video),
      uploadDate: project.year ? `${project.year}-01-01T00:00:00+00:00` : undefined,
      contentUrl: video.contentUrl,
      embedUrl: video.embedUrl,
      url: pageUrl,
      isPartOf: { "@id": `${pageUrl}#webpage` },
      ...(project.director
        ? { director: { "@type": "Person", name: project.director } }
        : {}),
      ...(project.production_company
        ? {
            productionCompany: {
              "@type": "Organization",
              name: project.production_company,
            },
          }
        : {}),
    });
  }

  return graph;
}

export function hasProjectWatchPage(project) {
  return Boolean(resolveProjectVideo(project));
}

/** Etiqueta para Admin: estado de indexación de vídeo en Google. */
export function getProjectVideoSeoLabel(project) {
  if (project?.published === false) {
    return { status: "draft", label: "Borrador", title: "No indexado hasta publicar" };
  }
  const video = resolveProjectVideo(project);
  if (!video) {
    return {
      status: "none",
      label: "Sin vídeo",
      title: "Añade preview_url de Vimeo o YouTube para indexación de vídeo",
    };
  }
  const provider = video.provider === "youtube" ? "YouTube" : "Vimeo";
  return {
    status: "ok",
    label: `Video SEO · ${provider}`,
    title: `Watch page automática en /project/${project.slug}`,
  };
}
