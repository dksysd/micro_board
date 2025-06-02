# 🏗️ Microboard - 마이크로서비스 게시판 애플리케이션

Docker 기반 마이크로서비스 아키텍처로 구현된 게시판 시스템

## 📋 목차

- [빠른 시작](#-빠른-시작)
- [서비스 구조](#-서비스-구조)
- [환경 설정](#-환경-설정)
- [실행 방법](#-실행-방법)

## 🚀 빠른 시작

```bash
# 1. 프로젝트 클론
git clone git clone https://github.com/dksysd/micro_board.git
cd micro_board

# 2. 환경변수 수정 (필수)
nano ./.env

# 3. 애플리케이션 실행
docker compose up -d
```

## 🏛️ 서비스 구조

### 마이크로서비스 구성
```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│  API Gateway    │
│   (React)       │    │   (Nginx)       │
│   Port: 3000    │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼─────┐ ┌───────▼─────┐ ┌───────▼─────┐
        │Auth Service │ │Post Service │ │Comment      │
        │Port: 3001   │ │Port: 3002   │ │Service      │
        │             │ │             │ │Port: 3003   │
        └─────────────┘ └─────────────┘ └─────────────┘
                │               │               │
        ┌───────▼─────┐ ┌───────▼─────┐ ┌───────▼─────┐
        │Auth DB      │ │Post DB      │ │Comment DB   │
        │PostgreSQL   │ │PostgreSQL   │ │PostgreSQL   │
        └─────────────┘ └─────────────┘ └─────────────┘
```

### 네트워크 분리
- **frontend-network**: 프론트엔드 ↔ API Gateway
- **app-network**: 백엔드 서비스 간 통신 (내부)
- **db-network**: 데이터베이스 전용 (내부)

### 데이터 저장
- **Named Volumes**: Docker 관리 볼륨 사용
- **데이터 격리**: 서비스별 독립적인 데이터베이스

## ⚙️ 환경 설정

### 보안 설정 체크리스트
- [ ] 강력한 데이터베이스 비밀번호 설정
- [ ] JWT 시크릿 키 32자 이상으로 설정
- [ ] CORS 도메인을 실제 도메인으로 변경

## 🐳 실행 방법

### 실행
```bash
# 1. 애플리케이션 실행
docker compose up -d

# 2. 로그 확인
docker compose logs -f

# 3. 특정 서비스 로그 확인
docker compose -f auth-service
```

### 중지 및 정리
```bash
# 애플리케이션 중지
docker compose down

# 볼륨까지 삭제 (데이터 완전 삭제)
docker compose down -v

# 이미지까지 정리
docker compose down --rmi all -v
```