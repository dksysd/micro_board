const {Pool} = require('pg');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

// 데이터베이스 연결 풀
const pool = new Pool({
    host: process.env.DB_HOST || 'post-db',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postdb',
    user: process.env.DB_USER || 'postuser',
    password: process.env.DB_PASSWORD || 'postpass',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 연결 테스트
async function connectDB() {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger.info('PostgreSQL connected successfully');
    } catch (error) {
        logger.error('Database connection failed:', error.message);
        throw error;
    }
}

// 테이블 초기화
async function initDB() {
    const createPostsTable = `
        CREATE TABLE IF NOT EXISTS posts
        (
            id
            SERIAL
            PRIMARY
            KEY,
            title
            VARCHAR
        (
            255
        ) NOT NULL,
            content TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
    `;

    const createIndexes = `
        CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
        CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    `;

    const createUpdatedAtTrigger = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
    CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

    try {
        await pool.query(createPostsTable);
        await pool.query(createIndexes);
        await pool.query(createUpdatedAtTrigger);
        logger.info('Database tables initialized successfully');
    } catch (error) {
        logger.error('Database initialization failed:', error.message);
        throw error;
    }
}

// 쿼리 실행 헬퍼
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Executed query', {text, duration, rows: res.rowCount});
        return res;
    } catch (error) {
        logger.error('Database query error:', {text, error: error.message});
        throw error;
    }
}

// 트랜잭션 헬퍼
async function getClient() {
    const client = await pool.connect();
    return client;
}

module.exports = {
    connectDB,
    initDB,
    query,
    pool
};