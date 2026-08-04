const verifyToken = require('./_verifyToken');
const applyCors = require('./_cors');
const { createSignedUpload } = require('./_cloudinaryUpload');
const { resolveUploadFolder } = require('./_uploadPaths');

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
    const { projectSlug, assetType = 'site' } = req.body || {};
    const folder = resolveUploadFolder({ projectSlug, assetType });
    const signed = createSignedUpload({ folder, assetType });

    return res.status(200).json({ ok: true, ...signed });
  } catch (err) {
    if (err.code === 'INVALID_SLUG') {
      return res.status(400).json({ ok: false, message: 'Define un slug válido para el proyecto' });
    }
    if (err.code === 'INVALID_ASSET_TYPE') {
      return res.status(400).json({ ok: false, message: err.message });
    }
    if (err.code === 'CLOUDINARY_NOT_CONFIGURED') {
      return res.status(503).json({ ok: false, message: err.message });
    }
    console.error('[api/upload-sign]', err.message);
    return res.status(500).json({ ok: false, message: err.message || 'Error al preparar la subida' });
  }
};
