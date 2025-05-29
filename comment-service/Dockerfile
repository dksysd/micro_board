FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apk update && apk add --no-cache \
    postgresql-client \
    && rm -rf /var/cache/apk/*

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 애플리케이션 코드 복사
COPY . .

# 비-root 사용자 생성 및 권한 설정
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# 포트 노출
EXPOSE 3003

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const req = http.request({hostname: 'localhost', port: 3003, path: '/health'}, \
    (res) => process.exit(res.statusCode === 200 ? 0 : 1)); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# 사용자 변경
USER nodejs

# 애플리케이션 실행
CMD ["npm", "start"]