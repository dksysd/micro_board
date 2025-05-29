const axios = require('axios');

// Auth Service에서 토큰 검증
async function verifyAuthToken(req, authServiceUrl) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authentication Required');
    }

    try {
        const response = await axios.post(`${authServiceUrl}/api/auth/verify`, {}, {
            headers: {
                Authorization: authHeader
            },
            timeout: 5000
        });

        if (response.data.valid) {
            return response.data.user;
        } else {
            throw new Error('Invalid Token');
        }
    } catch (error) {
        if (error.response) {
            // Auth Service에서 반환한 에러
            throw new Error(error.response.data.message || 'Authentication Failed');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            // Auth Service 연결 실패
            console.error('Auth Service connection failed:', error.message);
            throw new Error('Authentication Service Unavailable');
        } else {
            // 기타 에러
            console.error('Token verification error:', error.message);
            throw new Error('Authentication Failed');
        }
    }
}

// Auth Service에서 사용자 정보 조회
async function getUserInfo(authServiceUrl, userIds) {
    if (!Array.isArray(userIds)) {
        userIds = [userIds];
    }

    try {
        const response = await axios.post(`${authServiceUrl}/api/users/bulk`, {
            userIds
        }, {
            timeout: 5000
        });

        return response.data.users || [];
    } catch (error) {
        if (error.response) {
            console.error('Get user info error:', error.response.data.message);
        } else {
            console.error('Auth Service connection error:', error.message);
        }
        throw new Error('Failed to fetch user information');
    }
}

// Post Service에서 게시글 존재 확인
async function verifyPostExists(postServiceUrl, postId) {
    try {
        const response = await axios.get(`${postServiceUrl}/api/posts/${postId}`, {
            timeout: 5000
        });

        return response.data.post;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error('Post not found');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error('Post Service connection failed:', error.message);
            throw new Error('Post Service Unavailable');
        } else {
            console.error('Post verification error:', error.message);
            throw new Error('Failed to verify post existence');
        }
    }
}

// 선택적 인증 (토큰이 있으면 검증, 없으면 null 반환)
async function optionalAuth(req, authServiceUrl) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        return await verifyAuthToken(req, authServiceUrl);
    } catch (error) {
        // 토큰이 유효하지 않아도 에러를 던지지 않고 null 반환
        return null;
    }
}

module.exports = {
    verifyAuthToken,
    getUserInfo,
    verifyPostExists,
    optionalAuth
};