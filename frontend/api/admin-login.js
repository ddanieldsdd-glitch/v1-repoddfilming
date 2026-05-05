const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { password } = req.body || {};
  const serverPassword = process.env.ADMIN_PASSWORD;

  if (!password || !serverPassword || password !== serverPassword) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '2h' });

  // Cookie HttpOnly, Secure, SameSite=Strict, duración 2 horas
  const cookieValue = `token=${token}; HttpOnly; Path=/; Max-Age=${2*60*60}; SameSite=Strict; Secure`;
  res.setHeader('Set-Cookie', cookieValue);

  return res.status(200).json({ ok: true });
};
