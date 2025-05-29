#!/bin/bash

# Docker 빌드 문제 해결 스크립트
set -e

echo "🔧 Docker 빌드 문제를 해결합니다..."

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Docker 캐시 정리
clean_docker_cache() {
    print_step "Docker 빌드 캐시를 정리합니다..."

    # 빌드 캐시 정리
    docker builder prune -f

    # 사용하지 않는 이미지 정리
    docker image prune -f

    print_success "Docker 캐시가 정리되었습니다."
}

# .dockerignore 파일 생성
create_dockerignore() {
    print_step ".dockerignore 파일을 확인합니다..."

    services=("auth-service" "post-service" "comment-service" "frontend")

    for service in "${services[@]}"; do
        if [ ! -f "$service/.dockerignore" ]; then
            print_warning "$service/.dockerignore가 없습니다. 기본 파일을 생성합니다."

            cat > "$service/.dockerignore" << 'EOF'
# Dependencies
node_modules
npm-debug.log*

# Testing
coverage
*.test.js

# Environment variables
.env*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Documentation
*.md

# Logs
logs
*.log
EOF
            print_success "$service/.dockerignore가 생성되었습니다."
        fi
    done
}

# package.json 검증
verify_package_json() {
    print_step "package.json 파일을 검증합니다..."

    # Frontend package.json 확인
    if [ -f "frontend/package.json" ]; then
        if grep -q "react-scripts" "frontend/package.json"; then
            print_success "frontend/package.json에 react-scripts가 있습니다."
        else
            print_error "frontend/package.json에 react-scripts가 없습니다."
            exit 1
        fi
    else
        print_error "frontend/package.json 파일이 없습니다."
        exit 1
    fi

    # Backend services package.json 확인
    for service in auth-service post-service comment-service; do
        if [ -f "$service/package.json" ]; then
            if grep -q "express" "$service/package.json"; then
                print_success "$service/package.json이 올바릅니다."
            else
                print_warning "$service/package.json에 express가 없을 수 있습니다."
            fi
        else
            print_error "$service/package.json 파일이 없습니다."
        fi
    done
}

# 개별 이미지 빌드 테스트
test_individual_builds() {
    print_step "개별 서비스 빌드를 테스트합니다..."

    services=("auth-service" "post-service" "comment-service")

    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            print_step "$service 빌드 테스트 중..."
            if docker build -t microboard/$service:test ./$service; then
                print_success "$service 빌드 성공"
                docker rmi microboard/$service:test 2>/dev/null || true
            else
                print_error "$service 빌드 실패"
                return 1
            fi
        fi
    done

    # Frontend 빌드 테스트
    if [ -d "frontend" ]; then
        print_step "frontend 빌드 테스트 중..."
        if docker build -t microboard/frontend:test ./frontend; then
            print_success "frontend 빌드 성공"
            docker rmi microboard/frontend:test 2>/dev/null || true
        else
            print_error "frontend 빌드 실패"
            return 1
        fi
    fi
}

# Node modules 정리
clean_node_modules() {
    print_step "node_modules를 정리합니다 (선택사항)..."

    read -p "모든 node_modules를 삭제하고 다시 설치하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for service in auth-service post-service comment-service frontend; do
            if [ -d "$service/node_modules" ]; then
                print_step "$service/node_modules 삭제 중..."
                rm -rf "$service/node_modules"
                print_success "$service/node_modules가 삭제되었습니다."
            fi
        done

        print_step "의존성을 다시 설치합니다..."
        for service in auth-service post-service comment-service frontend; do
            if [ -f "$service/package.json" ]; then
                print_step "$service 의존성 설치 중..."
                cd "$service"
                npm install
                cd ..
                print_success "$service 의존성 설치 완료"
            fi
        done
    fi
}

# 권한 문제 해결
fix_permissions() {
    print_step "파일 권한을 확인합니다..."

    # 스크립트 실행 권한
    chmod +x scripts/*.sh 2>/dev/null || true

    # Docker 소켓 권한 확인
    if groups | grep -q docker; then
        print_success "Docker 그룹 권한이 있습니다."
    else
        print_warning "Docker 그룹 권한이 없습니다. 다음 명령어를 실행해보세요:"
        echo "  sudo usermod -aG docker \$USER"
        echo "  그 후 로그아웃 후 재로그인하세요."
    fi
}

# 메인 실행
main() {
    echo "🔧 Docker Build Fix Script"
    echo "=========================="
    echo ""

    clean_docker_cache
    create_dockerignore
    verify_package_json
    fix_permissions

    print_step "빌드 테스트를 수행하시겠습니까?"
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_individual_builds
    fi

    clean_node_modules

    print_success "🎉 Docker 빌드 문제 해결이 완료되었습니다!"
    echo ""
    echo "📋 다음 단계:"
    echo "1. 개발환경 재시작: make dev-restart"
    echo "2. 또는 직접 빌드: docker-compose -f docker-compose.dev.yml up --build"
}

main "$@"