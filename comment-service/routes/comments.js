const express = require('express');
const Joi = require('joi');
const {query} = require('../config/database');
const {verifyAuthToken, getUserInfo, verifyPostExists} = require('../utils/auth');

const router = express.Router();

// 입력 검증 스키마
const createCommentSchema = Joi.object({
    content: Joi.string().min(1).required()
});

const updateCommentSchema = Joi.object({
    content: Joi.string().min(1).required()
});

// 특정 게시글의 댓글 목록 조회
router.get('/posts/:postId/comments', async (req, res) => {
    try {
        const {postId} = req.params;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid post ID'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // 최대 100개
        const offset = (page - 1) * limit;

        // 게시글 존재 확인
        const postServiceUrl = req.app.get('postServiceUrl');
        try {
            await verifyPostExists(postServiceUrl, postId);
        } catch (error) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Post not found'
            });
        }

        // 전체 댓글 수 조회
        const countResult = await query(
            'SELECT COUNT(*) as total FROM comments WHERE post_id = $1',
            [postId]
        );
        const total = parseInt(countResult.rows[0].total);

        // 댓글 목록 조회
        const result = await query(
            'SELECT id, post_id, author_id, content, created_at, updated_at FROM comments WHERE post_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
            [postId, limit, offset]
        );

        // 작성자 정보 조회
        const authorIds = [...new Set(result.rows.map(comment => comment.author_id))];
        const authServiceUrl = req.app.get('authServiceUrl');

        let authorsMap = {};
        if (authorIds.length > 0) {
            try {
                const authors = await getUserInfo(authServiceUrl, authorIds);
                authorsMap = authors.reduce((map, author) => {
                    map[author.id] = author;
                    return map;
                }, {});
            } catch (error) {
                console.warn('Failed to fetch author info:', error.message);
            }
        }

        // 응답 데이터 구성
        const comments = result.rows.map(comment => ({
            id: comment.id,
            postId: comment.post_id,
            content: comment.content,
            author: authorsMap[comment.author_id] || {id: comment.author_id, username: 'Unknown'},
            createdAt: comment.created_at,
            updatedAt: comment.updated_at
        }));

        res.json({
            comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch comments'
        });
    }
});

// 댓글 작성 (인증 필요)
router.post('/posts/:postId/comments', async (req, res) => {
    try {
        const {postId} = req.params;

        if (!postId || isNaN(postId)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid post ID'
            });
        }

        // 토큰 검증
        const authServiceUrl = req.app.get('authServiceUrl');
        const user = await verifyAuthToken(req, authServiceUrl);

        // 게시글 존재 확인
        const postServiceUrl = req.app.get('postServiceUrl');
        try {
            await verifyPostExists(postServiceUrl, postId);
        } catch (error) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Post not found'
            });
        }

        // 입력 검증
        const {error, value} = createCommentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        const {content} = value;

        // 댓글 생성
        const result = await query(
            'INSERT INTO comments (post_id, author_id, content) VALUES ($1, $2, $3) RETURNING *',
            [postId, user.id, content]
        );

        const newComment = result.rows[0];

        res.status(201).json({
            message: 'Comment created successfully',
            comment: {
                id: newComment.id,
                postId: newComment.post_id,
                content: newComment.content,
                author: {
                    id: user.id,
                    username: user.username
                },
                createdAt: newComment.created_at,
                updatedAt: newComment.updated_at
            }
        });

    } catch (error) {
        if (error.message === 'Authentication Required' || error.message === 'Invalid Token') {
            return res.status(401).json({
                error: 'Authentication Required',
                message: error.message
            });
        }

        console.error('Create comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create comment'
        });
    }
});

// 댓글 수정 (인증 필요)
router.put('/comments/:id', async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid comment ID'
            });
        }

        // 토큰 검증
        const authServiceUrl = req.app.get('authServiceUrl');
        const user = await verifyAuthToken(req, authServiceUrl);

        // 입력 검증
        const {error, value} = updateCommentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        // 댓글 존재 확인 및 권한 검증
        const existingComment = await query(
            'SELECT id, author_id FROM comments WHERE id = $1',
            [id]
        );

        if (existingComment.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Comment not found'
            });
        }

        if (existingComment.rows[0].author_id !== user.id) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only edit your own comments'
            });
        }

        const {content} = value;

        // 댓글 수정
        const result = await query(
            'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
            [content, id]
        );

        const updatedComment = result.rows[0];

        res.json({
            message: 'Comment updated successfully',
            comment: {
                id: updatedComment.id,
                postId: updatedComment.post_id,
                content: updatedComment.content,
                author: {
                    id: user.id,
                    username: user.username
                },
                createdAt: updatedComment.created_at,
                updatedAt: updatedComment.updated_at
            }
        });

    } catch (error) {
        if (error.message === 'Authentication Required' || error.message === 'Invalid Token') {
            return res.status(401).json({
                error: 'Authentication Required',
                message: error.message
            });
        }

        console.error('Update comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update comment'
        });
    }
});

// 댓글 삭제 (인증 필요)
router.delete('/comments/:id', async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid comment ID'
            });
        }

        // 토큰 검증
        const authServiceUrl = req.app.get('authServiceUrl');
        const user = await verifyAuthToken(req, authServiceUrl);

        // 댓글 존재 확인 및 권한 검증
        const existingComment = await query(
            'SELECT id, author_id FROM comments WHERE id = $1',
            [id]
        );

        if (existingComment.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Comment not found'
            });
        }

        if (existingComment.rows[0].author_id !== user.id) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete your own comments'
            });
        }

        // 댓글 삭제
        await query('DELETE FROM comments WHERE id = $1', [id]);

        res.json({
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        if (error.message === 'Authentication Required' || error.message === 'Invalid Token') {
            return res.status(401).json({
                error: 'Authentication Required',
                message: error.message
            });
        }

        console.error('Delete comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete comment'
        });
    }
});

// 댓글 상세 조회
router.get('/comments/:id', async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid comment ID'
            });
        }

        const result = await query(
            'SELECT id, post_id, author_id, content, created_at, updated_at FROM comments WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Comment not found'
            });
        }

        const comment = result.rows[0];

        // 작성자 정보 조회
        const authServiceUrl = req.app.get('authServiceUrl');
        let author = {id: comment.author_id, username: 'Unknown'};

        try {
            const authors = await getUserInfo(authServiceUrl, [comment.author_id]);
            if (authors.length > 0) {
                author = authors[0];
            }
        } catch (error) {
            console.warn('Failed to fetch author info:', error.message);
        }

        res.json({
            comment: {
                id: comment.id,
                postId: comment.post_id,
                content: comment.content,
                author,
                createdAt: comment.created_at,
                updatedAt: comment.updated_at
            }
        });

    } catch (error) {
        console.error('Get comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch comment'
        });
    }
});

module.exports = router;