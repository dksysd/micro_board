# MicroBoard Platform Makefile
# 개발 및 배포를 위한 편의 명령어들

.PHONY: help dev dev-start dev-stop dev-clean dev-logs dev-status build deploy clean setup-permissions

# 기본 타겟
help: ## 도움말 출력
	@echo "MicroBoard Platform - 사용 가능한 명령어들:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# 권한 설정
setup-permissions: ## 스크립트 실행 권한 설정
	@echo "🔧 스크립트 실행 권한을 설정합니다..."
	chmod +x scripts/*.sh
	@echo "✅ 권한 설정이 완료되었습니다."

# 개발환경 관련 명령어
dev: dev-start ## 개발환경 시작 (dev-start와 동일)

dev-start: setup-permissions ## 개발환경 시작
	@echo "🚀 개발환경을 시작합니다..."
	./scripts/dev.sh start

dev-stop: setup-permissions ## 개발환경 중지
	@echo "🛑 개발환경을 중지합니다..."
	./scripts/dev.sh stop

dev-restart: setup-permissions ## 개발환경 재시작
	@echo "🔄 개발환경을 재시작합니다..."
	./scripts/dev.sh restart

dev-clean: setup-permissions ## 개발환경 정리 (컨테이너, 볼륨 삭제)
	@echo "🧹 개발환경을 정리합니다..."
	./scripts/dev.sh clean

dev-logs: setup-permissions ## 개발환경 로그 출력
	@echo "📋 서비스 로그를 출력합니다..."
	./scripts/dev.sh logs

dev-status: setup-permissions ## 개발환경 상태 확인
	@echo "📊 서비스 상태를 확인합니다..."
	./scripts/dev.sh status

dev-health: setup-permissions ## 개발환경 헬스체크
	@echo "🏥 서비스 헬스체크를 수행합니다..."
	./scripts/dev.sh health

dev-build: setup-permissions ## 개발환경 이미지 재빌드
	@echo "🔨 이미지를 재빌드합니다..."
	./scripts/dev.sh build

# Docker 관련 문제 해결
fix-docker: setup-permissions ## Docker 빌드 문제 해결
	@echo "🔧 Docker 빌드 문제를 해결합니다..."
	./scripts/fix-docker.sh

# 프로덕션 배포 관련 명령어
build: setup-permissions ## 프로덕션 이미지 빌드 및 배포
	@echo "🏗️ 프로덕션 환경을 빌드합니다..."
	./scripts/build.sh

deploy: build ## 빌드 후 배포 (build와 동일)

# 환경 설정
setup: setup-permissions ## 초기 환경 설정
	@echo "⚙️ 초기 환경을 설정합니다..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "📝 .env 파일이 생성되었습니다. 필요에 따라 수정해주세요."; \
	fi
	@mkdir -p logs data/postgres init-scripts
	@echo "✅ 환경 설정이 완료되었습니다."

# 정리 명령어
clean-images: ## 사용하지 않는 Docker 이미지 정리
	@echo "🧹 사용하지 않는 Docker 이미지를 정리합니다..."
	docker image prune -f
	docker system prune -f

clean-all: ## 모든 Docker 리소스 정리 (주의!)
	@echo "⚠️ 모든 Docker 리소스를 정리합니다..."
	@read -p "정말로 모든 Docker 리소스를 삭제하시겠습니까? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker system prune -a -f --volumes; \
		echo "✅ 정리가 완료되었습니다."; \
	else \
		echo "❌ 정리가 취소되었습니다."; \
	fi

# 서비스별 로그 확인
logs-auth: ## Auth Service 로그 확인
	docker-compose -f docker-compose.dev.yml logs -f auth-service

logs-post: ## Post Service 로그 확인
	docker-compose -f docker-compose.dev.yml logs -f post-service

logs-comment: ## Comment Service 로그 확인
	docker-compose -f docker-compose.dev.yml logs -f comment-service

logs-frontend: ## Frontend 로그 확인
	docker-compose -f docker-compose.dev.yml logs -f frontend

logs-gateway: ## API Gateway 로그 확인
	docker-compose -f docker-compose.dev.yml logs -f api-gateway

# 데이터베이스 관리
db-connect-auth: ## Auth 데이터베이스 연결
	docker exec -it microboard-auth-db psql -U authuser -d authdb

db-connect-post: ## Post 데이터베이스 연결
	docker exec -it microboard-post-db psql -U postuser -d postdb

db-connect-comment: ## Comment 데이터베이스 연결
	docker exec -it microboard-comment-db psql -U commentuser -d commentdb

db-backup: ## 데이터베이스 백업 생성
	@echo "💾 데이터베이스 백업을 생성합니다..."
	@mkdir -p backups
	docker exec microboard-auth-db pg_dump -U authuser authdb > backups/auth-$(shell date +%Y%m%d_%H%M%S).sql
	docker exec microboard-post-db pg_dump -U postuser postdb > backups/post-$(shell date +%Y%m%d_%H%M%S).sql
	docker exec microboard-comment-db pg_dump -U commentuser commentdb > backups/comment-$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ 백업이 backups/ 디렉토리에 생성되었습니다."

# 테스트 관련
test: ## 테스트 실행
	@echo "🧪 테스트를 실행합니다..."
	cd auth-service && npm test
	cd post-service && npm test
	cd comment-service && npm test
	cd frontend && npm test

test-auth: ## Auth Service 테스트
	cd auth-service && npm test

test-post: ## Post Service 테스트
	cd post-service && npm test

test-comment: ## Comment Service 테스트
	cd comment-service && npm test

test-frontend: ## Frontend 테스트
	cd frontend && npm test

# 코드 품질
lint: ## 코드 린팅 실행
	@echo "🔍 코드 린팅을 실행합니다..."
	cd auth-service && npm run lint
	cd post-service && npm run lint
	cd comment-service && npm run lint
	cd frontend && npm run lint

format: ## 코드 포맷팅 실행
	@echo "✨ 코드 포맷팅을 실행합니다..."
	cd auth-service && npm run format
	cd post-service && npm run format
	cd comment-service && npm run format
	cd frontend && npm run format

# 유틸리티
install: ## 모든 서비스의 의존성 설치
	@echo "📦 의존성을 설치합니다..."
	cd auth-service && npm install
	cd post-service && npm install
	cd comment-service && npm install
	cd frontend && npm install

update: ## 모든 서비스의 의존성 업데이트
	@echo "🔄 의존성을 업데이트합니다..."
	cd auth-service && npm update
	cd post-service && npm update
	cd comment-service && npm update
	cd frontend && npm update

# 문서 관련
docs: ## 문서 생성 (JSDoc)
	@echo "📚 문서를 생성합니다..."
	@echo "문서 생성 기능은 추후 구현 예정입니다."

# 기본 타겟을 help로 설정
.DEFAULT_GOAL := help