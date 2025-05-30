const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const {connectDB, initDB} = require('./config/database');

// Logger 설정
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({stack: true}),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Secret 읽기 (Docker Secrets 지원)
let JWT_SECRET;
try {
    // Docker Secrets에서 읽기 시도
    if (fs.existsSync('/run/secrets/jwt_secret')) {
        JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();
        logger.info('JWT Secret loaded from Docker Secrets');
    } else {
        // 환경변수에서 읽기
        JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
        logger.info('JWT Secret loaded from environment variable');
    }
} catch (error) {
    JWT_SECRET = 'fallback-secret-key';
    logger.warn('Using fallback JWT Secret');
}

// JWT Secret을 전역적으로 사용할 수 있도록 설정
app.set('jwtSecret', JWT_SECRET);

// 미들웨어 설정
app.use(helmet());
// 개발환경에서만 CORS 활성화 (nginx 우회 시)
if (process.env.NODE_ENV === 'development' && process.env.DIRECT_ACCESS === 'true') {
    const cors = require('cors');
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true
    }));
    console.log('CORS enabled for direct development access');
} else {
    console.log('CORS handled by nginx - no local CORS setup');
}
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

// 로깅 미들웨어
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString()
    });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 에러 처리
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// 전역 에러 처리
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);

    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : err.message
    });
});

// 서버 시작
async function startServer() {
    try {
        // 데이터베이스 연결
        await connectDB();
        logger.info('Database connected successfully');

        // 데이터베이스 초기화
        await initDB();
        logger.info('Database initialized successfully');

        // 서버 시작
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Auth Service running on port ${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();