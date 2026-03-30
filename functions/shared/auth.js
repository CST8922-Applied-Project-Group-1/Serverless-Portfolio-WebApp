const jwt = require('jsonwebtoken');

/**
 * Middleware to validate JWT token
 * Add this to any function that requires authentication
 */
function validateToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your-secret-key-change-this'
        );
        
        return { 
            valid: true, 
            user: {
                userId: decoded.userId,
                email: decoded.email,
                name: decoded.name
            }
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { valid: false, error: 'Token expired' };
        }
        return { valid: false, error: 'Invalid token' };
    }
}

/**
 * Helper to send unauthorized response
 */
function unauthorizedResponse(error = 'Unauthorized') {
    return {
        status: 401,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: { error: error }
    };
}

module.exports = {
    validateToken,
    unauthorizedResponse
};
