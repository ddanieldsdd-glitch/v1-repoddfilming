const applyCors = require('./_cors');
const { extractVimeoId, getVimeoMeta } = require('./_vimeoMeta');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const source = req.query?.url || req.query?.id;
    const id = extractVimeoId(source);
    if (!id) {
      return res.status(400).json({ message: 'Invalid Vimeo URL or id' });
    }

    const meta = await getVimeoMeta(id);
    return res.status(200).json(meta);
  } catch (err) {
    console.error('[vimeo-meta]', err?.message || err);
    return res.status(500).json({ message: 'Failed to resolve Vimeo metadata' });
  }
};
