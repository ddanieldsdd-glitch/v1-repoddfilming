const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;
  try {
    return jwt.verify(match[1], process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return null;
  }
};
