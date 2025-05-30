# 프론트엔드 Dockerfile - nginx 서빙 버전

# 멀티 스테이지 빌드
FROM node:18-alpine AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 빌드에 필요한 모든 의존성 설치 (devDependencies 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# React 앱 빌드
RUN npm run build

# === nginx 서빙 스테이지 ===
FROM nginx:1.25-alpine AS production

# 기본 nginx 설정 제거
RUN rm /etc/nginx/conf.d/default.conf

# 빌드된 React 앱을 nginx 웹 루트로 복사
COPY --from=builder /app/build /usr/share/nginx/html

# 커스텀 nginx 설정 복사 (프록시 설정 포함)
COPY nginx.conf /etc/nginx/nginx.conf

# nginx 설정 테스트
RUN nginx -t

# 포트 노출
EXPOSE 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]

# === 개발 스테이지 (선택사항) ===
FROM node:18-alpine AS development

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 개발 서버 실행 (nginx 없이)
EXPOSE 3000
CMD ["npm", "start"]