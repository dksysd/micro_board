const fs = require('fs');
const path = require('path');

class SecretsLoader {
    constructor() {
        this.secretsPath = '/run/secrets';
        this.loadedSecrets = {};
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    /**
     * Secret 파일을 읽어서 환경변수로 설정
     * @param {string} secretName - Secret 이름
     * @param {string} envVarName - 설정할 환경변수 이름 (선택사항)
     * @returns {string} Secret 값
     */
    loadSecret(secretName, envVarName = null) {
        try {
            const secretFilePath = path.join(this.secretsPath, secretName);

            // 파일이 존재하는지 확인
            if (!fs.existsSync(secretFilePath)) {
                // Secret 파일이 없으면 기존 환경변수 사용 (개발환경 호환성)
                const fallbackEnvVar = envVarName || secretName.toUpperCase();
                const envValue = process.env[fallbackEnvVar];

                if (!envValue) {
                    if (this.isProduction) {
                        throw new Error(`Secret file ${secretName} not found in production environment`);
                    }
                    // 개발환경에서는 기본값 제공
                    const defaultValue = this.getDefaultValue(secretName);
                    console.log(`Using default value for ${secretName} in development mode`);
                    return defaultValue;
                }

                console.log(`Using environment variable ${fallbackEnvVar} as fallback for secret ${secretName}`);
                return envValue;
            }

            // Secret 파일 읽기
            const secretValue = fs.readFileSync(secretFilePath, 'utf8').trim();

            // 환경변수로 설정
            const targetEnvVar = envVarName || secretName.toUpperCase();
            process.env[targetEnvVar] = secretValue;

            // 캐시에 저장 (마스킹된 값)
            this.loadedSecrets[secretName] = this.maskSensitiveValue(secretName, secretValue);

            console.log(`Loaded secret ${secretName} into environment variable ${targetEnvVar}`);
            return secretValue;

        } catch (error) {
            console.error(`Failed to load secret ${secretName}:`, error.message);
            if (this.isProduction) {
                throw error;
            }
            return this.getDefaultValue(secretName);
        }
    }

    /**
     * 개발환경용 기본값 제공
     * @param {string} secretName - Secret 이름
     * @returns {string} 기본값
     */
    getDefaultValue(secretName) {
        const defaults = {
            // 데이터베이스 설정
            'auth_db_host': 'localhost',
            'auth_db_port': '5432',
            'auth_db_name': 'microboard_auth_dev',
            'auth_db_user': 'dev_user',
            'auth_db_password': 'dev_password_123',

            'post_db_host': 'localhost',
            'post_db_port': '5433',
            'post_db_name': 'microboard_posts_dev',
            'post_db_user': 'dev_user',
            'post_db_password': 'dev_password_123',

            'comment_db_host': 'localhost',
            'comment_db_port': '5434',
            'comment_db_name': 'microboard_comments_dev',
            'comment_db_user': 'dev_user',
            'comment_db_password': 'dev_password_123',

            // 애플리케이션 설정
            'jwt_secret': 'dev_jwt_secret_key_for_development_only',
            'node_env': 'development',
            'auth_service_port': '3001',
            'post_service_port': '3002',
            'comment_service_port': '3003',
            'cors_origin': 'http://localhost:3000',
            'auth_service_url': 'http://localhost:3001',
            'post_service_url': 'http://localhost:3002',

            // 기타 설정
            'api_gateway_key': 'dev_api_key_123',
            'log_level': 'debug',
            'log_format': 'pretty',
            'max_file_size': '5242880',
            'max_posts_per_page': '20',
            'max_comments_per_page': '50',
            'bcrypt_rounds': '10',
            'max_login_attempts': '5'
        };

        return defaults[secretName] || `dev_${secretName}_value`;
    }

    /**
     * 민감한 값 마스킹
     * @param {string} secretName - Secret 이름
     * @param {string} value - 원본 값
     * @returns {string} 마스킹된 값
     */
    maskSensitiveValue(secretName, value) {
        if (secretName.includes('password') || secretName.includes('secret') || secretName.includes('key')) {
            return value.length > 8 ? value.substring(0, 4) + '****' + value.substring(value.length - 4) : '****';
        }
        return value;
    }

    /**
     * 여러 Secret을 한번에 로드
     * @param {Object} secretMappings - {secretName: envVarName} 매핑
     */
    loadSecrets(secretMappings) {
        const results = {};

        for (const [secretName, envVarName] of Object.entries(secretMappings)) {
            try {
                results[secretName] = this.loadSecret(secretName, envVarName);
            } catch (error) {
                console.error(`Failed to load secret ${secretName}:`, error.message);
                if (this.isProduction) {
                    // 프로덕션에서는 필수 Secret이 로드되지 않으면 프로세스 종료
                    process.exit(1);
                }
                results[secretName] = this.getDefaultValue(secretName);
            }
        }

        return results;
    }

    /**
     * 데이터베이스 연결 정보를 Secret에서 로드
     * @param {string} dbPrefix - 데이터베이스 prefix (auth, post, comment)
     * @returns {Object} 데이터베이스 설정 객체
     */
    loadDatabaseConfig(dbPrefix) {
        const dbConfig = {
            host: this.loadSecret(`${dbPrefix}_db_host`, 'DB_HOST'),
            port: parseInt(this.loadSecret(`${dbPrefix}_db_port`, 'DB_PORT')),
            database: this.loadSecret(`${dbPrefix}_db_name`, 'DB_NAME'),
            user: this.loadSecret(`${dbPrefix}_db_user`, 'DB_USER'),
            password: this.loadSecret(`${dbPrefix}_db_password`, 'DB_PASSWORD'),

            // 연결 풀 설정
            max: parseInt(this.loadSecret('db_max_connections', 'DB_MAX_CONNECTIONS')),
            connectionTimeoutMillis: parseInt(this.loadSecret('db_connection_timeout', 'DB_CONNECTION_TIMEOUT')),
            idleTimeoutMillis: parseInt(this.loadSecret('db_idle_timeout', 'DB_IDLE_TIMEOUT'))
        };

        console.log(`Database config loaded for ${dbPrefix}:`, {
            ...dbConfig,
            password: '[HIDDEN]'
        });

        return dbConfig;
    }

    /**
     * 애플리케이션 설정을 Secret에서 로드
     * @returns {Object} 애플리케이션 설정 객체
     */
    loadAppConfig() {
        const appConfig = {
            nodeEnv: this.loadSecret('node_env', 'NODE_ENV'),
            jwtSecret: this.loadSecret('jwt_secret', 'JWT_SECRET'),
            jwtExpiresIn: this.loadSecret('jwt_expires_in', 'JWT_EXPIRES_IN'),
            jwtRefreshExpiresIn: this.loadSecret('jwt_refresh_expires_in', 'JWT_REFRESH_EXPIRES_IN'),
            jwtAlgorithm: this.loadSecret('jwt_algorithm', 'JWT_ALGORITHM'),
            corsOrigin: this.loadSecret('cors_origin', 'CORS_ORIGIN'),

            // 보안 설정
            bcryptRounds: parseInt(this.loadSecret('bcrypt_rounds', 'BCRYPT_ROUNDS')),
            maxLoginAttempts: parseInt(this.loadSecret('max_login_attempts', 'MAX_LOGIN_ATTEMPTS')),
            sessionTimeout: parseInt(this.loadSecret('session_timeout', 'SESSION_TIMEOUT')),

            // 로깅 설정
            logLevel: this.loadSecret('log_level', 'LOG_LEVEL'),
            logFormat: this.loadSecret('log_format', 'LOG_FORMAT')
        };

        console.log('Application config loaded:', {
            ...appConfig,
            jwtSecret: '[HIDDEN]'
        });

        return appConfig;
    }

    /**
     * 서비스별 포트 설정 로드
     * @param {string} serviceName - 서비스 이름 (auth, post, comment)
     * @returns {number} 포트 번호
     */
    loadServicePort(serviceName) {
        const port = parseInt(this.loadSecret(`${serviceName}_service_port`, 'PORT'));
        console.log(`Service port loaded for ${serviceName}: ${port}`);
        return port;
    }

    /**
     * 외부 서비스 URL 로드
     * @param {string} serviceName - 서비스 이름
     * @returns {string} 서비스 URL
     */
    loadServiceUrl(serviceName) {
        const url = this.loadSecret(`${serviceName}_service_url`, `${serviceName.toUpperCase()}_SERVICE_URL`);
        console.log(`Service URL loaded for ${serviceName}: ${url}`);
        return url;
    }

    /**
     * 성능 및 제한 설정 로드
     * @returns {Object} 성능 설정 객체
     */
    loadPerformanceConfig() {
        return {
            maxFileSize: parseInt(this.loadSecret('max_file_size', 'MAX_FILE_SIZE')),
            maxPostsPerPage: parseInt(this.loadSecret('max_posts_per_page', 'MAX_POSTS_PER_PAGE')),
            maxCommentsPerPage: parseInt(this.loadSecret('max_comments_per_page', 'MAX_COMMENTS_PER_PAGE')),
            rateLimitRequests: parseInt(this.loadSecret('rate_limit_requests', 'RATE_LIMIT_REQUESTS')),
            rateLimitWindow: parseInt(this.loadSecret('rate_limit_window', 'RATE_LIMIT_WINDOW')),
            cacheTtl: parseInt(this.loadSecret('cache_ttl', 'CACHE_TTL'))
        };
    }

    /**
     * 외부 서비스 통합 설정 로드
     * @returns {Object} 외부 서비스 설정 객체
     */
    loadExternalServiceConfig() {
        return {
            smtp: {
                host: this.loadSecret('smtp_host', 'SMTP_HOST'),
                port: parseInt(this.loadSecret('smtp_port', 'SMTP_PORT')),
                user: this.loadSecret('smtp_user', 'SMTP_USER')
            },
            redis: {
                url: this.loadSecret('redis_url', 'REDIS_URL')
            }
        };
    }

    /**
     * 헬스체크 설정 로드
     * @returns {Object} 헬스체크 설정 객체
     */
    loadHealthCheckConfig() {
        return {
            interval: parseInt(this.loadSecret('health_check_interval', 'HEALTH_CHECK_INTERVAL')),
            timeout: parseInt(this.loadSecret('health_check_timeout', 'HEALTH_CHECK_TIMEOUT')),
            retries: parseInt(this.loadSecret('health_check_retries', 'HEALTH_CHECK_RETRIES'))
        };
    }

    /**
     * 모든 설정을 한번에 로드하는 편의 메서드
     * @param {string} serviceName - 서비스 이름 (auth, post, comment)
     * @returns {Object} 전체 설정 객체
     */
    loadAllConfigs(serviceName) {
        console.log(`Loading all configurations for ${serviceName} service...`);

        const configs = {
            service: serviceName,
            database: this.loadDatabaseConfig(serviceName),
            app: this.loadAppConfig(),
            port: this.loadServicePort(serviceName),
            performance: this.loadPerformanceConfig(),
            external: this.loadExternalServiceConfig(),
            healthCheck: this.loadHealthCheckConfig()
        };

        // 서비스별 특별 설정
        if (serviceName !== 'auth') {
            configs.serviceUrls = {
                auth: this.loadServiceUrl('auth')
            };

            if (serviceName === 'comment') {
                configs.serviceUrls.post = this.loadServiceUrl('post');
            }
        }

        console.log(`All configurations loaded for ${serviceName} service`);
        return configs;
    }

    /**
     * 로드된 모든 Secret 정보 반환 (패스워드 제외)
     * @returns {Object} 로드된 Secret 정보
     */
    getLoadedSecrets() {
        return { ...this.loadedSecrets };
    }

    /**
     * Secret 파일들이 모두 존재하는지 검증
     * @param {Array} requiredSecrets - 필수 Secret 목록
     * @returns {boolean} 모든 Secret이 존재하면 true
     */
    validateSecrets(requiredSecrets) {
        const missingSecrets = [];

        for (const secretName of requiredSecrets) {
            const secretFilePath = path.join(this.secretsPath, secretName);
            if (!fs.existsSync(secretFilePath) && this.isProduction) {
                missingSecrets.push(secretName);
            }
        }

        if (missingSecrets.length > 0) {
            console.error('Missing required secrets in production:', missingSecrets);
            return false;
        }

        console.log('All required secrets are available');
        return true;
    }

    /**
     * Secret 로딩 상태 및 환경 정보 출력
     */
    printStatus() {
        console.log('\n=== Secrets Loader Status ===');
        console.log(`Environment: ${this.isProduction ? 'Production' : 'Development'}`);
        console.log(`Secrets Path: ${this.secretsPath}`);
        console.log(`Loaded Secrets: ${Object.keys(this.loadedSecrets).length}`);
        console.log('Loaded Secret Names:');
        Object.keys(this.loadedSecrets).forEach(name => {
            console.log(`  - ${name}: ${this.loadedSecrets[name]}`);
        });
        console.log('==============================\n');
    }
}

// 싱글톤 인스턴스 생성
const secretsLoader = new SecretsLoader();

module.exports = secretsLoader;

// ===== 실제 사용 예시 =====

/*
// auth-service/app.js 에서 실제 사용 예시:

const express = require('express');
const secretsLoader = require('./utils/secretsLoader');

// 시작 시 모든 필요한 설정 로드
const config = secretsLoader.loadAllConfigs('auth');

// Express 앱 설정
const app = express();
const PORT = config.port;

// 데이터베이스 연결 설정
const { Pool } = require('pg');
const dbPool = new Pool(config.database);

// JWT 설정
const jwt = require('jsonwebtoken');
const JWT_SECRET = config.app.jwtSecret;
const JWT_EXPIRES_IN = config.app.jwtExpiresIn;

// 미들웨어 설정
app.use(express.json({ limit: config.performance.maxFileSize }));

// CORS 설정
const cors = require('cors');
app.use(cors({
  origin: config.app.corsOrigin.split(','),
  credentials: true
}));

// 헬스체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    // 데이터베이스 연결 테스트
    await dbPool.query('SELECT 1');

    res.json({
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      environment: config.app.nodeEnv,
      database: {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        status: 'connected'
      },
      configuration: {
        jwtConfigured: !!JWT_SECRET,
        corsOrigins: config.app.corsOrigin,
        bcryptRounds: config.app.bcryptRounds,
        maxLoginAttempts: config.app.maxLoginAttempts
      },
      secrets: secretsLoader.getLoadedSecrets()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth service listening at http://0.0.0.0:${PORT}`);
  secretsLoader.printStatus();
});

// 그레이스풀 셧다운
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing database connections...');
  dbPool.end(() => {
    console.log('Database pool closed.');
    process.exit(0);
  });
});
*/