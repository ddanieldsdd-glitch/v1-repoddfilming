/**
 * Utilidades compartidas de SEO de vídeo (Vimeo + YouTube).
 * Usadas por og.js, sitemap.js y (vía copia ES module) el cliente.
 *
 * Cualquier proyecto con preview_url o cover de vídeo obtiene automáticamente
 * watch page, JSON-LD, sitemap de vídeo e iframe para crawlers.
 */

const { getVimeoMeta } = require('./_vimeoMeta');

function isVideoUrl(url) {
  return /vimeo\.com|youtube\.com|youtu\.be/i.test(String(url || ''));
}

/** Parsea una URL de Vimeo o YouTube en metadatos de reproductor. */
function parseVideoUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;

  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    const id = vimeo[1];
    return {
      provider: 'vimeo',
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
      provider: 'youtube',
      id,
      contentUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube.com/embed/${id}`,
      defaultThumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  return null;
}

/** URL de vídeo del proyecto: preview_url → cover (misma lógica que ProjectDetail). */
function getProjectVideoUrl(project) {
  if (!project) return null;
  const preview = project.preview_url && String(project.preview_url).trim();
  if (preview && isVideoUrl(preview)) return preview;
  const cover = project.cover && String(project.cover).trim();
  if (cover && isVideoUrl(cover)) return cover;
  return null;
}

function resolveProjectVideo(project) {
  const url = getProjectVideoUrl(project);
  return url ? parseVideoUrl(url) : null;
}

function toVideoThumb(url) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/w_1280')) return url;
  return url.replace('/upload/', '/upload/w_1280,h_720,c_fill,g_auto,q_auto,f_jpg/');
}

function getProjectVideoThumbnail(project, video) {
  const cover = project?.cover && String(project.cover).trim();
  if (cover && !isVideoUrl(cover)) return toVideoThumb(cover);
  const poster = project?.poster && String(project.poster).trim();
  if (poster) return toVideoThumb(poster);
  return video?.defaultThumbnail || '';
}

function projectDescription(project, fallback = 'Proyecto cinematográfico de Dani Díaz.') {
  return (project?.synopsis?.es || project?.synopsis?.en || fallback).slice(0, 500);
}

/**
 * uploadDate es obligatorio para Google (VideoObject). Si no hay dato mejor,
 * se usa esta fecha fija para que el nodo nunca quede sin el campo.
 */
const FALLBACK_UPLOAD_DATE = '2024-01-01T00:00:00+00:00';

function projectUploadDate(project) {
  const year = Number.parseInt(project?.year, 10);
  return Number.isFinite(year) && year > 1900 ? `${year}-01-01T00:00:00+00:00` : FALLBACK_UPLOAD_DATE;
}

/**
 * Metadatos reales del vídeo (fecha de subida, duración) desde Vimeo.
 * Se resuelven por id en cada petición (caché 24 h), así que cambiar el
 * vídeo desde /admin actualiza JSON-LD y sitemap sin tocar nada más.
 * YouTube no expone la fecha sin API key: se usa el año del proyecto.
 */
async function getVideoMeta(video, { timeoutMs = 3000 } = {}) {
  if (!video || video.provider !== 'vimeo') return null;
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    return await Promise.race([getVimeoMeta(video.id).catch(() => null), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function videoUploadDate(project, meta) {
  return meta?.upload_date || projectUploadDate(project);
}

/** Segundos → duración ISO 8601 (65 → "PT1M5S"). */
function toIsoDuration(seconds) {
  const total = Math.round(Number(seconds));
  if (!Number.isFinite(total) || total <= 0) return undefined;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

/** Nodos WebPage + VideoObject para JSON-LD de un proyecto. */
function buildProjectVideoGraph(project, pageUrl, siteName = 'Dani Díaz', meta = null) {
  const video = resolveProjectVideo(project);
  const description = projectDescription(project);
  const videoNodeId = video ? `${pageUrl}#video` : undefined;

  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: `${project.title} — ${siteName}`,
      description,
      inLanguage: ['es', 'en'],
      author: { '@id': 'https://ddanidiaz.com/#person' },
      mainEntity: videoNodeId ? { '@id': videoNodeId } : undefined,
    },
  ];

  if (video) {
    graph.push({
      '@type': 'VideoObject',
      '@id': `${pageUrl}#video`,
      name: project.title,
      description,
      thumbnailUrl: getProjectVideoThumbnail(project, video),
      uploadDate: videoUploadDate(project, meta),
      duration: toIsoDuration(meta?.duration),
      contentUrl: video.contentUrl,
      embedUrl: video.embedUrl,
      url: pageUrl,
      isPartOf: { '@id': `${pageUrl}#webpage` },
      director: project.director
        ? { '@type': 'Person', name: project.director }
        : undefined,
      productionCompany: project.production_company
        ? { '@type': 'Organization', name: project.production_company }
        : undefined,
    });
  }

  return graph;
}

function buildProjectVideoJsonLd(project, pageUrl, siteName, meta = null) {
  const graph = buildProjectVideoGraph(project, pageUrl, siteName, meta);
  return JSON.stringify(
    { '@context': 'https://schema.org', '@graph': graph },
    (_, v) => (v === undefined ? undefined : v),
    2,
  );
}

/** Bloque XML <video:video> para sitemap (Vimeo o YouTube). */
function buildVideoSitemapBlock({ videoUrl, title, description, thumb, publicationDate, durationSec }) {
  const video = parseVideoUrl(videoUrl);
  if (!video) return '';

  const poster = thumb || video.defaultThumbnail;
  const desc = String(description || '').slice(0, 2048);

  const escXml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  return [
    '    <video:video>',
    `      <video:thumbnail_loc>${escXml(poster)}</video:thumbnail_loc>`,
    `      <video:title>${escXml(title)}</video:title>`,
    desc ? `      <video:description>${escXml(desc)}</video:description>` : '',
    `      <video:player_loc>${escXml(video.embedUrl)}</video:player_loc>`,
    durationSec ? `      <video:duration>${Math.round(durationSec)}</video:duration>` : '',
    publicationDate ? `      <video:publication_date>${escXml(publicationDate)}</video:publication_date>` : '',
    '      <video:family_friendly>yes</video:family_friendly>',
    '    </video:video>',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildProjectVideoSitemapBlock(project, meta = null) {
  const videoUrl = getProjectVideoUrl(project);
  if (!videoUrl) return '';
  const video = parseVideoUrl(videoUrl);
  if (!video) return '';

  return buildVideoSitemapBlock({
    videoUrl,
    title: project.title,
    description: project.synopsis?.es || project.synopsis?.en || '',
    thumb: getProjectVideoThumbnail(project, video),
    publicationDate: videoUploadDate(project, meta),
    durationSec: meta?.duration,
  });
}

module.exports = {
  getVideoMeta,
  videoUploadDate,
  FALLBACK_UPLOAD_DATE,
  projectUploadDate,
  toIsoDuration,
  isVideoUrl,
  parseVideoUrl,
  getProjectVideoUrl,
  resolveProjectVideo,
  toVideoThumb,
  getProjectVideoThumbnail,
  projectDescription,
  buildProjectVideoGraph,
  buildProjectVideoJsonLd,
  buildVideoSitemapBlock,
  buildProjectVideoSitemapBlock,
};
