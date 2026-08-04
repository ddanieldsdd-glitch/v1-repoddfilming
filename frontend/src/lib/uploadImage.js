const MAX_BYTES = 10 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Sube una imagen al Admin → Cloudinary (requiere sesión admin).
 * @param {File} file
 * @param {{ folder?: string }} options
 * @returns {Promise<string>} URL segura de Cloudinary
 */
export async function uploadImageFile(file, { folder = 'ddp-portfolio/site' } = {}) {
  if (!file) throw new Error('No se seleccionó ningún archivo');
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes');
  if (file.size > MAX_BYTES) throw new Error('La imagen supera el límite de 10 MB');

  const dataUrl = await readFileAsDataUrl(file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: dataUrl, folder }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Error al subir la imagen');
  }

  return data.url;
}
