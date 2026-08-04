import { prepareImageForUpload } from './prepareImageForUpload';

const CLOUDINARY_UPLOAD = (cloudName) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

/**
 * Sube una imagen: optimiza en el navegador → firma en servidor → subida directa a Cloudinary.
 * Evita el límite de peso de Vercel y aplica compresión de alta calidad.
 *
 * @param {File} file
 * @param {{ projectSlug?: string, assetType?: string }} options
 * @returns {Promise<string>} URL segura de Cloudinary
 */
export async function uploadImageFile(
  file,
  { projectSlug, assetType = 'site' } = {},
) {
  if (!file) throw new Error('No se seleccionó ningún archivo');
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes');

  if (assetType !== 'site' && !projectSlug) {
    throw new Error('Define el slug del proyecto antes de subir imágenes');
  }

  const prepared = await prepareImageForUpload(file, assetType);

  const signRes = await fetch('/api/upload-sign', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectSlug, assetType }),
  });

  const sign = await signRes.json().catch(() => ({}));
  if (!signRes.ok) {
    throw new Error(sign.message || 'Error al autorizar la subida');
  }

  const form = new FormData();
  form.append('file', prepared);
  form.append('api_key', sign.apiKey);
  form.append('timestamp', String(sign.timestamp));
  form.append('signature', sign.signature);
  form.append('folder', sign.folder);
  form.append('transformation', sign.transformation);

  const uploadRes = await fetch(CLOUDINARY_UPLOAD(sign.cloudName), {
    method: 'POST',
    body: form,
  });

  const data = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(data.error?.message || 'Error al subir a Cloudinary');
  }

  return data.secure_url;
}

/** Ruta Cloudinary esperada (solo informativa en Admin). */
export function cloudinaryFolderHint(projectSlug, assetType) {
  if (assetType === 'site') return 'ddp-portfolio/site';
  if (!projectSlug) return 'ddp-portfolio/{slug}/…';
  return `ddp-portfolio/${projectSlug}/${assetType}`;
}
