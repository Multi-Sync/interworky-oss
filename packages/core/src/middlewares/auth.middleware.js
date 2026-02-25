const jwt = require('jsonwebtoken');
require('../config')();
const { getConfig } = require('dotenv-handler');
const HttpError = require('../utils/HttpError');

const JWT_SECRET = getConfig('JWT_SECRET');

// Middleware to check JWT (required)
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    throw new HttpError('Access denied. No token provided.').Unauthorized();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId || decoded.sub;
    next();
  } catch (ex) {
    throw new HttpError('Invalid token', ex).Unauthorized();
  }
};

/**
 * Optional auth middleware - extracts user if token present, but doesn't fail if not
 * Use for endpoints that work for both authenticated and unauthenticated users
 */
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    // No token, continue without user
    req.user = null;
    req.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId || decoded.sub;
  } catch (ex) {
    // Invalid token, continue without user (don't fail)
    req.user = null;
    req.userId = null;
  }
  next();
};

module.exports = authenticateToken;
module.exports.optionalAuth = optionalAuth;
