// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// --- V2: JWT Secret ---
const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SUPER_SECRET_KEY_REPLACE_ME';

// --- V2: API JWT Verification Middleware ---
async function verifyApiToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No API token provided.');
  }
  const apiToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(apiToken, JWT_SECRET);
    req.user = decoded; // Attach user info (uid, email) to the request object
    next();
  } catch (error) {
    console.error('Error verifying API token:', error);
    return res.status(403).send('Unauthorized: Invalid API token.');
  }
}

module.exports = {
  verifyApiToken,
  JWT_SECRET
};