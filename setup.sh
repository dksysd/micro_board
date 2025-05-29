#!/bin/bash

# MicroBoard 플랫폼 초기 설정 스크립트
set -e

echo "🚀 MicroBoard 플랫폼 초기 설정을 시작합니다..."

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
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

# 필수 요구사항 확인
check_requirements() {
    print_step "필수 요구사항을 확인합니다..."

    # Docker 확인
    if ! command -v docker &> /dev/null; then
        print_error "Docker가 설치되어 있지 않습니다."
        echo "Docker 설치 방법: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker가 설치되어 있습니다."

    # Docker Compose 확인
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose가 설치되어 있지 않습니다."
        echo "Docker Compose 설치 방법: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose가 설치되어 있습니다."

    # Make 확인 (선택사항)
    if command -v make &> /dev/null; then
        print_success "Make가 설치되어 있습니다. Makefile을 사용할 수 있습니다."
    else
        print_warning "Make가 설치되어 있지 않습니다. 직접 스크립트를 실행해야 합니다."
    fi

    # Node.js 확인 (로컬 개발용 - 선택사항)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js가 설치되어 있습니다. ($NODE_VERSION)"
    else
        print_warning "Node.js가 설치되어 있지 않습니다. 로컬 개발을 위해서는 Node.js 18+ 설치를 권장합니다."
    fi
}

# 디렉토리 구조 생성
create_directories() {
    print_step "필요한 디렉토리를 생성합니다..."

    directories=(
        "logs"
        "data/postgres"
        "data/redis"
        "backups"
        "uploads"
    )

    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "$dir 디렉토리가 생성되었습니다."
        else
            print_warning "$dir 디렉토리가 이미 존재합니다."
        fi
    done
}

# 환경 변수 파일 설정
setup_env_file() {
    print_step "환경 변수 파일을 설정합니다..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success ".env 파일이 생성되었습니다."

            # JWT Secret 자동 생성
            if command -v openssl &> /dev/null; then
                JWT_SECRET=$(openssl rand -base64 32)
                sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
                rm .env.bak 2>/dev/null || true
                print_success "JWT Secret이 자동으로 생성되었습니다."
            else
                print_warning "OpenSSL이 없어 JWT Secret을 자동 생성할 수 없습니다. .env 파일을 수동으로 편집해주세요."
            fi

            print_warning "필요에 따라 .env 파일의 다른 설정들도 확인 및 수정해주세요."
        else
            print_error ".env.example 파일이 없습니다."
            exit 1
        fi
    else
        print_warning ".env 파일이 이미 존재합니다."
    fi
}

# 스크립트 실행 권한 설정
set_permissions() {
    print_step "스크립트 실행 권한을 설정합니다..."

    scripts=(
        "setup.sh"
        "scripts/dev.sh"
        "scripts/build.sh"
    )

    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            chmod +x "$script"
            print_success "$script 실행 권한이 설정되었습니다."
        else
            print_warning "$script 파일이 없습니다."
        fi
    done
}

# Git 설정 확인
check_git_config() {
    print_step "Git 설정을 확인합니다..."

    if [ -d ".git" ]; then
        # .gitignore 파일 확인
        if [ ! -f ".gitignore" ]; then
            print_warning ".gitignore 파일이 없습니다. 기본 .gitignore를 생성합니다."
            cat > .gitignore << EOF
# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Docker
.dockerignore

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
build/
dist/

# Database data
data/
backups/

# Uploads
uploads/
EOF
            print_success ".gitignore 파일이 생성되었습니다."
        fi

        print_success "Git 저장소가 초기화되어 있습니다."
    else
        print_warning "Git 저장소가 초기화되어 있지 않습니다."
        read -p "Git 저장소를 초기화하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git init
            print_success "Git 저장소가 초기화되었습니다."
        fi
    fi
}

# Docker 권한 확인
check_docker_permissions() {
    print_step "Docker 권한을 확인합니다..."

    if docker ps >/dev/null 2>&1; then
        print_success "Docker에 접근할 수 있습니다."
    else
        print_error "Docker에 접근할 수 없습니다."
        print_warning "다음 중 하나를 시도해보세요:"
        echo "  1. sudo를 사용하여 이 스크립트를 실행"
        echo "  2. 현재 사용자를 docker 그룹에 추가: sudo usermod -aG docker \$USER"
        echo "  3. 새 터미널 세션을 시작하거나 로그아웃 후 재로그인"
        exit 1
    fi
}

# 사용법 안내
print_usage() {
    print_success "🎉 MicroBoard 플랫폼 초기 설정이 완료되었습니다!"
    echo ""
    echo "📋 다음 단계:"
    echo ""
    echo "1️⃣ 개발환경 시작:"
    echo "   make dev-start     (또는 ./scripts/dev.sh start)"
    echo ""
    echo "2️⃣ 프로덕션 환경 배포:"
    echo "   make build         (또는 ./scripts/build.sh)"
    echo ""
    echo "3️⃣ 도움말 확인:"
    echo "   make help          (또는 ./scripts/dev.sh help)"
    echo ""
    echo "🌐 접속 정보 (개발환경):"
    echo "   Frontend:    http://localhost:3000"
    echo "   API Gateway: http://localhost:8080"
    echo "   Adminer:     http://localhost:8081"
    echo ""
    echo "📚 자세한 사용법은 README.md 파일을 참고하세요."
    echo ""
}

# 메인 실행 부분
main() {
    echo "🏗️  MicroBoard Platform Setup"
    echo "=============================="
    echo ""

    check_requirements
    create_directories
    setup_env_file
    set_permissions
    check_git_config
    check_docker_permissions
    print_usage
}

# 스크립트 실행
main "$@"