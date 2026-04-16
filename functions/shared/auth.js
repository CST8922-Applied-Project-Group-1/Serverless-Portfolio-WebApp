const jwt = require('jsonwebtoken');

function validateToken(req) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    console.log('Authorization header:', authHeader);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    if (!authHeader) {
      return { valid: false, error: 'Missing Authorization header' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Invalid Authorization format' };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Decoded token:', decoded);

    return {
      valid: true,
      user: decoded
    };
  } catch (error) {
    console.log('Token validation error:', error.message);
    return {
      valid: false,
      error: error.message
    };
  }
}

function unauthorizedResponse(message = 'Unauthorized') {
  return {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: { error: message }
  };
}

module.exports = {
  validateToken,
  unauthorizedResponse
};