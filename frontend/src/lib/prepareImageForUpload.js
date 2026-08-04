/**
 * Prepara imágenes en el navegador antes de subirlas:
 * redimensiona solo si exceden el máximo web y comprime con alta calidad.
 */

const PRESETS = {
  cover: { maxEdge: 2560, jpegQuality: 0.9 },
  poster: { maxEdge: 3600, jpegQuality: 0.9 },
  stills: { maxEdge: 3840, jpegQuality: 0.9 },
  bts: { maxEdge: 3840, jpegQuality: 0.9 },
  recognitions: { maxEdge: 1600, jpegQuality: 0.95, forcePng: true },
  site: { maxEdge: 2800, jpegQuality: 0.9 },
};

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Error al optimizar la imagen'))),
      type,
      quality,
    );
  });
}

/**
 * @param {File} file
 * @param {string} assetType
 * @returns {Promise<File>}
 */
export async function prepareImageForUpload(file, assetType = 'stills') {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Solo se permiten imágenes');
  }

  const preset = PRESETS[assetType] || PRESETS.stills;
  const usePng = preset.forcePng || file.type === 'image/png' || file.type === 'image/webp';

  let img;
  try {
    img = await loadImageFromFile(file);
  } catch {
    throw new Error('Formato de imagen no soportado en el navegador');
  }

  const { width, height } = img;
  const maxEdge = Math.max(width, height);
  const scale = maxEdge > preset.maxEdge ? preset.maxEdge / maxEdge : 1;
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const needsResize = scale < 1;
  const isLargeJpeg = !usePng && file.size > 1.5 * 1024 * 1024;

  if (!needsResize && !isLargeJpeg && file.type !== 'image/bmp' && file.type !== 'image/tiff') {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  if (usePng) {
    ctx.clearRect(0, 0, targetW, targetH);
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  const mime = usePng ? 'image/png' : 'image/jpeg';
  const quality = usePng ? undefined : preset.jpegQuality;
  const blob = await canvasToBlob(canvas, mime, quality);
  const ext = usePng ? 'png' : 'jpg';
  const baseName = (file.name || 'upload').replace(/\.[^.]+$/, '');

  return new File([blob], `${baseName}.${ext}`, { type: mime, lastModified: Date.now() });
}
