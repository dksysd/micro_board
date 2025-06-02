FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apk update && apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# package.json과 package-lock.json 복사
COPY package*.json ./

# 개발 단계
FROM base AS development
RUN npm ci && npm cache clean --force
COPY . .

# 비-root 사용자 생성 및 권한 설정
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3001
CMD ["npm", "run", "dev"]

# 프로덕션 단계
FROM base AS production
RUN npm ci --only=production && npm cache clean --force
COPY . .

# 비-root 사용자 생성 및 권한 설정
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3001
CMD ["npm", "start"]