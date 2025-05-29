const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 입력 검증 스키마
const signupSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const signinSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// 회원가입
router.post('/signup', async (req, res) => {
    try {
        // 입력 검증
        const { error, value } = signupSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        const { username, email, password } = value;

        // 사용자 중복 확인
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Username or email already exists'
            });
        }

        // 비밀번호 해싱
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 사용자 생성
        const result = await query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, passwordHash]
        );

        const newUser = result.rows[0];

        // JWT 토큰 생성
        const jwtSecret = req.app.get('jwtSecret');
        const token = jwt.sign(
            {
                userId: newUser.id,
                username: newUser.username,
                email: newUser.email
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                createdAt: newUser.created_at
            },
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create user'
        });
    }
});

// 로그인
router.post('/signin', async (req, res) => {
    try {
        // 입력 검증
        const { error, value } = signinSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        const { email, password } = value;

        // 사용자 조회
        const result = await query(
            'SELECT id, username, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid email or password'
            });
        }

        // JWT 토큰 생성
        const jwtSecret = req.app.get('jwtSecret');
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to authenticate user'
        });
    }
});

// 프로필 조회 (인증 필요)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
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
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch profile'
        });
    }
});

// 토큰 검증 (다른 서비스에서 사용)
router.post('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication Required',
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        const jwtSecret = req.app.get('jwtSecret');

        const decoded = jwt.verify(token, jwtSecret);

        // 사용자 존재 확인
        const result = await query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Authentication Failed',
                message: 'User not found'
            });
        }

        res.json({
            valid: true,
            user: {
                id: decoded.userId,
                username: decoded.username,
                email: decoded.email
            }
        });

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
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to verify token'
        });
    }
});

module.exports = router;