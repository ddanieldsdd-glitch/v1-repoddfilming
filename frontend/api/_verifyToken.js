const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;

  try {
    return jwt.verify(match[1], jwtSecret);
  } catch {
    return null;
  }
};
