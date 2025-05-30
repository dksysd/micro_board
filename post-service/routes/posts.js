const express = require('express');
const Joi = require('joi');
const {query} = require('../config/database');
const {verifyAuthToken, getUserInfo} = require('../utils/auth');

const router = express.Router();

// 입력 검증 스키마
const createPostSchema = Joi.object({
    title: Joi.string().min(1).max(255).required(),
    content: Joi.string().min(1).required()
});

const updatePostSchema = Joi.object({
    title: Joi.string().min(1).max(255),
    content: Joi.string().min(1)
}).min(1);

// 게시글 목록 조회 (페이지네이션 및 검색 지원)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50); // 최대 50개
        const offset = (page - 1) * limit;
        const searchQuery = req.query.search ? req.query.search.trim() : '';

        let countSql = 'SELECT COUNT(*) as total FROM posts';
        let postsSql = 'SELECT id, title, content, author_id, created_at, updated_at FROM posts';
        let queryParams = [];
        let whereConditions = [];

        // 검색 기능 추가
        if (searchQuery) {
            whereConditions.push('(title ILIKE $1 OR content ILIKE $1)');
            queryParams.push(`%${searchQuery}%`);
        }

        // WHERE 절 추가
        if (whereConditions.length > 0) {
            const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
            countSql += whereClause;
            postsSql += whereClause;
        }

        // ORDER BY와 LIMIT, OFFSET 추가
        postsSql += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);

        // 전체 게시글 수 조회 (검색 조건 적용)
        const countResult = await query(countSql, queryParams);
        const total = parseInt(countResult.rows[0].total);

        // 게시글 목록 조회 (검색 조건 적용)
        const result = await query(postsSql, [...queryParams, limit, offset]);

        // 작성자 정보 조회
        const authorIds = [...new Set(result.rows.map(post => post.author_id))];
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
        const posts = result.rows.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content,
            author: authorsMap[post.author_id] || {id: post.author_id, username: 'Unknown'},
            createdAt: post.created_at,
            updatedAt: post.updated_at
        }));

        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            searchQuery // 현재 검색어도 응답에 포함
        });

    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch posts'
        });
    }
});

// 게시글 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid post ID'
            });
        }

        const result = await query(
            'SELECT id, title, content, author_id, created_at, updated_at FROM posts WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Post not found'
            });
        }

        const post = result.rows[0];

        // 작성자 정보 조회
        const authServiceUrl = req.app.get('authServiceUrl');
        let author = {id: post.author_id, username: 'Unknown'};

        try {
            const authors = await getUserInfo(authServiceUrl, [post.author_id]);
            if (authors.length > 0) {
                author = authors[0];
            }
        } catch (error) {
            console.warn('Failed to fetch author info:', error.message);
        }

        res.json({
            post: {
                id: post.id,
                title: post.title,
                content: post.content,
                author,
                createdAt: post.created_at,
                updatedAt: post.updated_at
            }
        });

    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch post'
        });
    }
});

// 게시글 작성 (인증 필요)
router.post('/', async (req, res) => {
    try {
        // 토큰 검증
        const authServiceUrl = req.app.get('authServiceUrl');
        const user = await verifyAuthToken(req, authServiceUrl);

        // 입력 검증
        const {error, value} = createPostSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        const {title, content} = value;

        // 게시글 생성
        const result = await query(
            'INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3) RETURNING *',
            [title, content, user.id]
        );

        const newPost = result.rows[0];

        res.status(201).json({
            message: 'Post created successfully',
            post: {
                id: newPost.id,
                title: newPost.title,
                content: newPost.content,
                author: {
                    id: user.id,
                    username: user.username
                },
                createdAt: newPost.created_at,
                updatedAt: newPost.updated_at
            }
        });

    } catch (error) {
        if (error.message === 'Authentication Required' || error.message === 'Invalid Token') {
            return res.status(401).json({
                error: 'Authentication Required',
                message: error.message
            });
        }

        console.error('Create post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create post'
        });
    }
});

// 게시글 수정 (인증 필요)
router.put('/:id', async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid post ID'
            });
        }

        // 토큰 검증
        const authServiceUrl = req.app.get('authServiceUrl');
        const user = await verifyAuthToken(req, authServiceUrl);

        // 입력 검증
        const {error, value} = updatePostSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        // 게시글 존재 확인 및 권한 검증
        const existingPost = await query(
            'SELECT id, author_id FROM posts WHERE id = $1',
            [id]
        );

        if (existingPost.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Post not found'
            });
        }

        if (existingPost.rows[0].author_id !== user.id) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only edit your own posts'
            });
        }

        // 게시글 수정
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (value.title) {
            updateFields.push(`title = $${paramIndex++}`);
            updateValues.push(value.title);
        }

        if (value.content) {
            updateFields.push(`content = $${paramIndex++}`);
            updateValues.push(value.content);
        }

        updateValues.push(id);

        const result = await query(
            `UPDATE posts
             SET ${updateFields.join(', ')}
             WHERE id = $${paramIndex} RETURNING *`,
            updateValues
        );

        const updatedPost = result.rows[0];

        res.json({
            message: 'Post updated successfully',
            post: {
                id: updatedPost.id,
                title: updatedPost.title,
                content: updatedPost.content,
                author: {
                    id: user.id,
                    username: user.username
                },
                createdAt: updatedPost.created_at,
                updatedAt: updatedPost.updated_at
            }
        });

    } catch (error) {
        if (error.message === 'Authentication Required' || error.message === 'Invalid Token') {
            return res.status(401).json({
                error: 'Authentication Required',
                message: error.message
            });
        }

        console.error('Update post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update post'
        });
    }
});

// 게시글 삭제 (인증 필요)
router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid post ID'
            });
        }

        // 토큰 검증
        const authServiceUrl = req.app.get('authServiceUrl');
        const user = await verifyAuthToken(req, authServiceUrl);

        // 게시글 존재 확인 및 권한 검증
        const existingPost = await query(
            'SELECT id, author_id FROM posts WHERE id = $1',
            [id]
        );

        if (existingPost.rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Post not found'
            });
        }

        if (existingPost.rows[0].author_id !== user.id) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete your own posts'
            });
        }

        // 게시글 삭제
        await query('DELETE FROM posts WHERE id = $1', [id]);

        res.json({
            message: 'Post deleted successfully'
        });

    } catch (error) {
        if (error.message === 'Authentication Required' || error.message === 'Invalid Token') {
            return res.status(401).json({
                error: 'Authentication Required',
                message: error.message
            });
        }

        console.error('Delete post error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete post'
        });
    }
});

module.exports = router;