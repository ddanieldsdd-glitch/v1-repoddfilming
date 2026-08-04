const crypto = require('crypto');

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dsphxo7mx';

function signParams(params, apiSecret) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(sorted + apiSecret).digest('hex');
}

/**
 * Sube una imagen a Cloudinary (data URI o URL remota).
 * @returns {Promise<{ url: string, publicId: string }>}
 */
async function uploadToCloudinary(file, { folder = 'ddp-portfolio' } = {}) {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret) {
    const err = new Error('Cloudinary no está configurado en el servidor');
    err.code = 'CLOUDINARY_NOT_CONFIGURED';
    throw err;
  }

  if (!file || typeof file !== 'string') {
    const err = new Error('Archivo inválido');
    err.code = 'INVALID_FILE';
    throw err;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = signParams(params, apiSecret);

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error?.message || 'Error al subir a Cloudinary');
    err.code = 'CLOUDINARY_UPLOAD_FAILED';
    throw err;
  }

  return { url: data.secure_url, publicId: data.public_id };
}

module.exports = { uploadToCloudinary, CLOUDINARY_CLOUD_NAME };
