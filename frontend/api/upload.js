const verifyToken = require('./_verifyToken');
const applyCors = require('./_cors');
const { uploadToCloudinary } = require('./_cloudinaryUpload');

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set([
  'ddp-portfolio/recognitions',
  'ddp-portfolio/stills',
  'ddp-portfolio/bts',
  'ddp-portfolio/covers',
  'ddp-portfolio/posters',
  'ddp-portfolio/site',
]);

function estimateDataUriBytes(dataUri) {
  const base64 = String(dataUri).split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ ok: false, message: 'No autorizado' });
  }

  try {
    const { file, folder = 'ddp-portfolio/site' } = req.body || {};

    if (!file || typeof file !== 'string') {
      return res.status(400).json({ ok: false, message: 'Falta el archivo' });
    }

    if (!file.startsWith('data:image/')) {
      return res.status(400).json({ ok: false, message: 'Solo se permiten imágenes' });
    }

    if (!ALLOWED_FOLDERS.has(folder)) {
      return res.status(400).json({ ok: false, message: 'Carpeta de destino no permitida' });
    }

    if (estimateDataUriBytes(file) > MAX_BYTES) {
      return res.status(400).json({ ok: false, message: 'La imagen supera el límite de 10 MB' });
    }

    const { url, publicId } = await uploadToCloudinary(file, { folder });
    return res.status(200).json({ ok: true, url, publicId });
  } catch (err) {
    if (err.code === 'CLOUDINARY_NOT_CONFIGURED') {
      return res.status(503).json({ ok: false, message: err.message });
    }
    console.error('[api/upload]', err.message);
    return res.status(500).json({ ok: false, message: err.message || 'Error al subir la imagen' });
  }
};
