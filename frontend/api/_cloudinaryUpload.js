const crypto = require('crypto');

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dsphxo7mx';

function signParams(params, apiSecret) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(sorted + apiSecret).digest('hex');
}

/** Transformación al subir: calidad máxima perceptual + formato eficiente para web. */
function getIncomingTransformation(assetType) {
  if (assetType === 'recognitions') {
    return 'c_limit,w_1600,q_auto:best/fl_progressive';
  }
  if (assetType === 'poster') {
    return 'c_limit,w_2400,h_3600,q_auto:best,f_auto/fl_progressive';
  }
  if (assetType === 'cover') {
    return 'c_limit,w_2560,h_1440,q_auto:best,f_auto/fl_progressive';
  }
  return 'c_limit,w_3840,q_auto:best,f_auto/fl_progressive';
}

/**
 * Genera credenciales firmadas para subida directa desde el navegador.
 */
function createSignedUpload({ folder, assetType = 'site' }) {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret) {
    const err = new Error('Cloudinary no está configurado en el servidor');
    err.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw err;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const transformation = getIncomingTransformation(assetType);
  const params = {
    folder,
    timestamp,
    transformation,
  };
  const signature = signParams(params, apiSecret);

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey,
    timestamp,
    signature,
    folder,
    transformation,
  };
}

module.exports = {
  CLOUDINARY_CLOUD_NAME,
  createSignedUpload,
  getIncomingTransformation,
  signParams,
};
