const ROOT = 'ddp-portfolio';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROJECT_ASSETS = new Set(['cover', 'poster', 'stills', 'bts', 'recognitions']);

/**
 * Resuelve la carpeta de Cloudinary para una subida.
 * Estructura: ddp-portfolio/{slug}/{tipo}
 */
function resolveUploadFolder({ projectSlug, assetType }) {
  if (assetType === 'site') {
    return `${ROOT}/site`;
  }

  if (!projectSlug || !SLUG_RE.test(projectSlug)) {
    const err = new Error('Slug de proyecto inválido');
    err.code = 'INVALID_SLUG';
    throw err;
  }

  if (!PROJECT_ASSETS.has(assetType)) {
    const err = new Error('Tipo de recurso no permitido');
    err.code = 'INVALID_ASSET_TYPE';
    throw err;
  }

  return `${ROOT}/${projectSlug}/${assetType}`;
}

module.exports = { resolveUploadFolder, ROOT, SLUG_RE, PROJECT_ASSETS };
