-- MicroBoard 데이터베이스 초기화 스크립트

-- Auth 데이터베이스 초기화
\c authdb;

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- 사용자 테이블에 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 샘플 사용자 데이터 삽입 (개발환경용)
INSERT INTO users (username, email, password_hash) VALUES
                                                       ('admin', 'admin@microboard.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyUWdw5o0XlC3G'), -- password: admin123
                                                       ('testuser', 'test@microboard.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyUWdw5o0XlC3G') -- password: admin123
    ON CONFLICT (username) DO NOTHING;

-- Post 데이터베이스 초기화
\c postdb;

-- 게시글 테이블 생성
CREATE TABLE IF NOT EXISTS posts (
                                     id SERIAL PRIMARY KEY,
                                     title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_posts_content ON posts USING gin(to_tsvector('english', content));

-- 샘플 게시글 데이터 삽입 (개발환경용)
INSERT INTO posts (title, content, author_id) VALUES
                                                  ('Docker Swarm을 활용한 마이크로서비스 아키텍처 구성',
                                                   '안녕하세요! 오늘은 Docker Swarm을 활용하여 마이크로서비스 아키텍처를 구성하는 방법에 대해 자세히 알아보겠습니다.\n\n## 1. Docker Swarm 소개\n\nDocker Swarm은 Docker의 네이티브 클러스터링 및 오케스트레이션 도구입니다. 여러 Docker 호스트를 하나의 가상 Docker 호스트로 관리할 수 있게 해줍니다.\n\n## 2. 마이크로서비스 아키텍처 설계\n\n우리가 구성할 MicroBoard 플랫폼은 다음과 같은 서비스들로 구성됩니다:\n\n- Auth Service: 사용자 인증 및 권한 관리\n- Post Service: 게시글 관리\n- Comment Service: 댓글 관리\n- API Gateway: 서비스 라우팅 및 로드 밸런싱\n\n## 3. 네트워크 분리 전략\n\n보안을 강화하기 위해 다음과 같이 네트워크를 분리합니다:\n\n- frontend-net: 프론트엔드와 API Gateway 간 통신\n- backend-net: API Gateway와 백엔드 서비스 간 통신\n- db-net: 백엔드 서비스와 데이터베이스 간 통신',
                                                   1),
                                                  ('Node.js와 Express로 REST API 구축하기',
                                                   'Node.js와 Express 프레임워크를 사용하여 RESTful API를 구축하는 방법을 단계별로 설명하겠습니다.\n\n## 기본 설정\n\n먼저 새로운 Node.js 프로젝트를 생성하고 필요한 패키지들을 설치해보겠습니다.\n\n```bash\nnpm init -y\nnpm install express cors helmet winston\n```\n\n## Express 서버 설정\n\n기본적인 Express 서버를 설정해보겠습니다.',
                                                   1),
                                                  ('React Hooks를 활용한 상태 관리 패턴',
                                                   'React Hooks를 사용한 효과적인 상태 관리 방법을 알아보겠습니다.\n\n## useState Hook\n\n가장 기본적인 상태 관리 Hook입니다.\n\n```javascript\nconst [count, setCount] = useState(0);\n```\n\n## useEffect Hook\n\n컴포넌트의 생명주기를 관리할 수 있습니다.',
                                                   1);

-- Comment 데이터베이스 초기화
\c commentdb;

-- 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
                                        id SERIAL PRIMARY KEY,
                                        post_id INTEGER NOT NULL,
                                        author_id INTEGER NOT NULL,
                                        content TEXT NOT NULL,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 샘플 댓글 데이터 삽입 (개발환경용)
INSERT INTO comments (post_id, author_id, content) VALUES
                                                       (1, 2, '정말 유용한 정보네요! Docker Swarm의 고가용성 설정 부분도 추가로 다뤄주시면 더 좋을 것 같습니다.'),
                                                       (1, 1, '네트워크 분리 전략이 인상적이네요. 실제 운영 환경에서도 이런 식으로 구성하시나요?'),
                                                       (2, 2, 'Express.js 설명이 매우 명확하네요. JWT 인증 부분도 다뤄주실 예정인가요?'),
                                                       (3, 1, 'useContext와 useReducer 조합도 설명해주시면 좋겠어요!');

-- 권한 설정 및 통계 업데이트
ANALYZE;