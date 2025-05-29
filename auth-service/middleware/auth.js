const jwt = require('jsonwebtoken');

// JWT 토큰 인증 미들웨어
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication Required',
            message: 'No token provided'
        });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거
    const jwtSecret = req.app.get('jwtSecret');

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded; // { userId, username, email, iat, exp }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token Expired',
                message: 'Token has expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid Token',
                message: 'Token is invalid'
            });
        }

        console.error('Token verification error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to verify token'
        });
    }
}

// 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 그냥 통과)
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = req.app.get('jwtSecret');

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
    } catch (error) {
        // 토큰이 유효하지 않아도 계속 진행
        req.user = null;
    }

    next();
}

module.exports = {
    authenticateToken,
    optionalAuth
};