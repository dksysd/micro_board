# 멀티 스테이지 빌드
FROM node:18-alpine as build

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 의존성 설치
RUN apk update && apk add --no-cache git curl

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (빌드를 위해 devDependencies도 포함)
RUN npm ci && npm cache clean --force

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN npm run build

# 프로덕션 스테이지
FROM nginx:alpine

# curl 설치 (헬스체크용)
RUN apk add --no-cache curl

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드된 파일을 Nginx 서빙 디렉토리로 복사
COPY --from=build /app/build /usr/share/nginx/html

# 필요한 디렉토리 생성 및 권한 설정
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# 포트 노출
EXPOSE 3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 비-root 사용자로 실행
USER nginx

# Nginx 시작
CMD ["nginx", "-g", "daemon off;"]