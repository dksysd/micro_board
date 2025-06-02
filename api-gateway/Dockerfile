FROM nginx:1.25-alpine

# 기본 Nginx 설정 파일 제거
RUN rm /etc/nginx/conf.d/default.conf

# 사용자 정의 Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# snippets 디렉토리 (cors.conf 포함) 복사
COPY snippets/ /etc/nginx/snippets/

# Nginx 설정 파일 테스트 (빌드 시점에 검증)
RUN nginx -t

# 로그 디렉토리 권한 설정
RUN touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    chown -R nginx:nginx /var/log/nginx

# 컨테이너 내부에서 nginx가 사용할 포트 노출 (nginx.conf의 listen과 일치해야 함)
EXPOSE 80

# 컨테이너 시작 시 Nginx 실행
CMD ["nginx", "-g", "daemon off;"]