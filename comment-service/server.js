const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');

const commentRoutes = require('./routes/comments');
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
const PORT = process.env.PORT || 3003;

// Auth Service와 Post Service URL 설정
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const POST_SERVICE_URL = process.env.POST_SERVICE_URL || 'http://post-service:3002';

app.set('authServiceUrl', AUTH_SERVICE_URL);
app.set('postServiceUrl', POST_SERVICE_URL);

// 미들웨어 설정
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
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
        service: 'comment-service',
        timestamp: new Date().toISOString()
    });
});

// API 라우트
app.use('/api', commentRoutes);

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
            logger.info(`Comment Service running on port ${PORT}`);
            logger.info(`Auth Service URL: ${AUTH_SERVICE_URL}`);
            logger.info(`Post Service URL: ${POST_SERVICE_URL}`);
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