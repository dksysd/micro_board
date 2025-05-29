const express = require('express');
const {query} = require('../config/database');

const router = express.Router();

// 사용자 정보 조회 (다른 서비스에서 사용)
router.get('/:userId', async (req, res) => {
    try {
        const {userId} = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid user ID'
            });
        }

        const result = await query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user'
        });
    }
});

// 여러 사용자 정보 조회 (벌크 조회)
router.post('/bulk', async (req, res) => {
    try {
        const {userIds} = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userIds must be a non-empty array'
            });
        }

        // userIds 검증
        const validUserIds = userIds.filter(id => !isNaN(id));
        if (validUserIds.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'No valid user IDs provided'
            });
        }

        const placeholders = validUserIds.map((_, index) => `$${index + 1}`).join(',');
        const result = await query(
            `SELECT id, username, email, created_at
             FROM users
             WHERE id IN (${placeholders})`,
            validUserIds
        );

        const users = result.rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.created_at
        }));

        res.json({
            users
        });

    } catch (error) {
        console.error('Bulk get users error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch users'
        });
    }
});

module.exports = router;