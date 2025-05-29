FROM nginx:1.25-alpine

# 기본 Nginx 설정 파일 제거 (새로운 설정으로 덮어쓰기 위함)
# 또는 특정 설정만 수정하고 싶다면 이 단계를 생략하고 COPY로 덮어쓸 수 있습니다.
RUN rm /etc/nginx/conf.d/default.conf

# 사용자 정의 Nginx 설정 파일 복사
# nginx.conf 파일을 /etc/nginx/nginx.conf 로 복사
COPY nginx.conf /etc/nginx/nginx.conf

# snippets 디렉토리 (cors.conf 포함) 복사
# Nginx 설정 파일 내에서 include snippets/cors.conf; 와 같이 참조하므로
# 해당 경로에 맞게 복사해야 합니다.
COPY snippets/ /etc/nginx/snippets/

# (선택 사항) 에러 페이지용 HTML 파일이 있다면 함께 복사
# COPY html/ /usr/share/nginx/html/

# Nginx가 실행될 포트 노출 (Docker 호스트와 연결될 포트)
# nginx.conf에서 listen 80; 으로 설정했으므로 80번 포트를 노출합니다.
EXPOSE 80

# (선택 사항) HTTPS를 사용한다면 443 포트도 노출
# EXPOSE 443

# 컨테이너 시작 시 Nginx 실행
# -g "daemon off;" 옵션은 Nginx를 foreground에서 실행시켜 Docker 컨테이너의 메인 프로세스로 만듭니다.
CMD ["nginx", "-g", "daemon off;"]