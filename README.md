# MicroBoard Platform

> Docker Swarm을 활용한 현대적인 마이크로서비스 기반 게시판 플랫폼

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-20+-blue.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🏗️ 프로젝트 개요

MicroBoard는 **Docker Swarm**을 활용한 마이크로서비스 아키텍처 기반의 현대적인 게시판 플랫폼입니다. 각 기능별로 독립적인 서비스로 분리되어 있어 확장성, 유지보수성, 그리고 장애 격리 측면에서
뛰어난 성능을 제공합니다.

### ✨ 주요 특징

- 🏛️ **마이크로서비스 아키텍처**: 각 도메인별 독립적인 서비스 구성
- 🐳 **Docker Swarm 오케스트레이션**: 컨테이너 클러스터링 및 자동 복구
- 🔒 **네트워크 분리**: 3계층 네트워크로 보안 강화
- 🔐 **JWT 기반 인증**: 무상태 인증 시스템
- 📱 **반응형 UI**: 모던한 React 기반 사용자 인터페이스
- 🔄 **로드 밸런싱**: Nginx를 통한 트래픽 분산
- 📊 **데이터베이스 분리**: 서비스별 독립적인 PostgreSQL 인스턴스

## 🏛️ 시스템 아키텍처

```
┌─────────────┐    ┌───────────────┐    ┌─────────────────┐    ┌──────────────┐
│   사용자     │────│   Frontend    │────│   API Gateway   │────│ Backend      │
│             │    │   (React)     │    │    (Nginx)      │    │ Services     │
└─────────────┘    └───────────────┘    └─────────────────┘    └──────────────┘
                           │                       │                    │
                    [frontend-net]         [backend-net]           [db-net]
                                                   │                    │
                                       ┌───────────┼───────────┐       │
                                       │           │           │       │
                               ┌───────────┐ ┌───────────┐ ┌─────────────┐
                               │   Auth    │ │   Post    │ │  Comment    │
                               │ Service   │ │ Service   │ │  Service    │
                               └───────────┘ └───────────┘ └─────────────┘
                                       │           │           │
                               ┌───────────┐ ┌───────────┐ ┌─────────────┐
                               │  Auth DB  │ │  Post DB  │ │ Comment DB  │
                               │(PostgreSQL)│ │(PostgreSQL)│ │(PostgreSQL) │
                               └───────────┘ └───────────┘ └─────────────┘
```

## 🛠️ 기술 스택

### Backend Services

- **Node.js 18+**: JavaScript 런타임
- **Express.js**: 웹 프레임워크
- **PostgreSQL 14**: 관계형 데이터베이스
- **JWT**: JSON Web Token 인증
- **bcryptjs**: 비밀번호 해싱
- **Winston**: 로깅 라이브러리
- **Joi**: 입력 검증

### Frontend

- **React 18**: 사용자 인터페이스 라이브러리
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Axios**: HTTP 클라이언트
- **Plus Jakarta Sans**: 웹 폰트

### Infrastructure

- **Docker & Docker Swarm**: 컨테이너 오케스트레이션
- **Nginx**: 리버스 프록시 및 로드 밸런서
- **Docker Secrets**: 민감 정보 관리
- **Docker Configs**: 설정 파일 관리
- **Overlay Networks**: 서비스 간 네트워크 분리

### Development Tools

- **Docker Compose**: 개발환경 구성
- **Adminer**: 데이터베이스 관리 도구
- **ESLint & Prettier**: 코드 품질 도구

## 🚀 빠른 시작

### 사전 요구사항

- **Docker 20.10+**
- **Docker Compose 2.0+**
- **Node.js 18+** (로컬 개발 시)
- **Git**

### 1. 프로젝트 클론

```bash
git clone https://github.com/your-username/microboard-platform.git
cd microboard-platform
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정을 변경하세요
```

### 3. 개발환경 실행

```bash
# 개발환경 시작
./scripts/dev.sh start

# 또는 직접 Docker Compose 사용
docker-compose -f docker-compose.dev.yml up -d
```

### 4. 프로덕션 환경 배포

```bash
# 프로덕션 환경 빌드 및 배포
./scripts/build.sh
```

## 📱 서비스 접근

### 개발환경

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Adminer (DB 관리)**: http://localhost:8081

### 프로덕션 환경

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:80

## 🔧 개발 가이드

### 로컬 개발 설정

각 서비스를 개별적으로 개발하려면:

```bash
# Auth Service
cd auth-service
npm install
npm run dev

# Post Service
cd post-service
npm install
npm run dev

# Comment Service
cd comment-service
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

### API 엔드포인트

#### 인증 API

- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/signin` - 로그인
- `GET /api/auth/profile` - 프로필 조회
- `POST /api/auth/verify` - 토큰 검증

#### 게시글 API

- `GET /api/posts` - 게시글 목록 조회
- `GET /api/posts/:id` - 게시글 상세 조회
- `POST /api/posts` - 게시글 작성 (인증 필요)
- `PUT /api/posts/:id` - 게시글 수정 (인증 필요)
- `DELETE /api/posts/:id` - 게시글 삭제 (인증 필요)

#### 댓글 API

- `GET /api/posts/:postId/comments` - 댓글 목록 조회
- `POST /api/posts/:postId/comments` - 댓글 작성 (인증 필요)
- `PUT /api/comments/:id` - 댓글 수정 (인증 필요)
- `DELETE /api/comments/:id` - 댓글 삭제 (인증 필요)

### 데이터베이스 스키마

#### Users 테이블 (Auth DB)

```sql
CREATE TABLE users
(
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE  NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Posts 테이블 (Post DB)

```sql
CREATE TABLE posts
(
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    author_id  INTEGER      NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Comments 테이블 (Comment DB)

```sql
CREATE TABLE comments
(
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER NOT NULL,
    author_id  INTEGER NOT NULL,
    content    TEXT    NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🐳 Docker Swarm 배포

### 1. Swarm 클러스터 구성

```bash
# Manager 노드 초기화
docker swarm init --advertise-addr <MANAGER_IP>

# Worker 노드 추가 (각 Worker 노드에서 실행)
docker swarm join --token <WORKER_TOKEN> <MANAGER_IP>:2377
```

### 2. 네트워크 생성

```bash
docker network create --driver overlay --attachable frontend-net
docker network create --driver overlay --attachable backend-net
docker network create --driver overlay --attachable db-net
```

### 3. Secrets 및 Configs 생성

```bash
# JWT Secret 생성
echo "your-jwt-secret-key" | docker secret create jwt_secret -

# Nginx 설정 생성
docker config create nginx_api_gateway_config ./api-gateway/nginx.conf
```

### 4. 스택 배포

```bash
docker stack deploy -c docker-stack.yml microboard-app
```

## 📊 모니터링 및 로깅

### 서비스 상태 확인

```bash
# 스택 서비스 상태
docker stack services microboard-app

# 개별 서비스 로그
docker service logs microboard-app_auth-service
docker service logs microboard-app_post-service
docker service logs microboard-app_comment-service
```

### 확장 및 롤링 업데이트

```bash
# 서비스 확장
docker service scale microboard-app_post-service=3

# 롤링 업데이트
docker service update --image microboard/auth-service:v2 microboard-app_auth-service
```

## 🔒 보안 고려사항

### 네트워크 분리

- **frontend-net**: Frontend ↔ API Gateway
- **backend-net**: API Gateway ↔ Backend Services
- **db-net**: Backend Services ↔ Databases

### 인증 및 권한

- JWT 토큰 기반 무상태 인증
- 비밀번호 bcrypt 해싱 (12 rounds)
- Docker Secrets로 민감 정보 관리

### API 보안

- CORS 정책 적용
- Rate Limiting
- Input validation (Joi)
- Helmet.js 보안 헤더

## 🚧 로드맵

- [ ] **v1.1**: 파일 업로드 기능
- [ ] **v1.2**: 실시간 알림 (WebSocket)
- [ ] **v1.3**: 검색 기능 강화
- [ ] **v2.0**: Kubernetes 지원
- [ ] **v2.1**: 캐싱 시스템 (Redis)
- [ ] **v2.2**: 모니터링 대시보드 (Prometheus + Grafana)

## 🤝 기여하기

1. 이 저장소를 Fork합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📝 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

## 👥 팀

- **Backend Developer**: Node.js, Express, PostgreSQL
- **Frontend Developer**: React, Tailwind CSS
- **DevOps Engineer**: Docker, Swarm, Nginx

## 📞 지원

문제가 발생하거나 질문이 있으시면 [Issues](https://github.com/your-username/microboard-platform/issues)를 통해 문의해주세요.

---

⭐ 이 프로젝트가 도움이 되셨다면 Star를 눌러주세요!