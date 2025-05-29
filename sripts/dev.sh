#!/bin/bash

# MicroBoard 개발환경 설정 스크립트
set -e

echo "🛠️  MicroBoard 개발환경을 설정합니다..."

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

# 명령어 파싱
COMMAND=${1:-"start"}

# 도움말 출력
show_help() {
    echo "MicroBoard 개발환경 관리 스크립트"
    echo ""
    echo "사용법: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     개발환경 시작 (기본값)"
    echo "  stop      개발환경 중지"
    echo "  restart   개발환경 재시작"
    echo "  clean     개발환경 정리 (컨테이너, 볼륨, 네트워크 삭제)"
    echo "  logs      모든 서비스 로그 출력"
    echo "  status    서비스 상태 확인"
    echo "  build     이미지 재빌드"
    echo "  help      이 도움말 출력"
    echo ""
}

# 필수 요구사항 확인
check_requirements() {
    print_step "필수 요구사항 확인 중..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker가 설치되어 있지 않습니다."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose가 설치되어 있지 않습니다."
        exit 1
    fi

    print_success "Docker 및 Docker Compose가 설치되어 있습니다."
}

# 환경 설정
setup_environment() {
    print_step "환경 설정 중..."

    # .env 파일 확인 및 생성
    if [ ! -f .env ]; then
        print_warning ".env 파일이 없습니다. .env.example을 복사합니다."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success ".env 파일이 생성되었습니다."
        else
            print_error ".env.example 파일이 없습니다."
            exit 1
        fi
    fi

    # 필요한 디렉토리 생성
    mkdir -p logs
    mkdir -p data/postgres

    print_success "환경 설정이 완료되었습니다."
}

# 개발환경 시작
start_dev() {
    print_step "개발환경을 시작합니다..."

    check_requirements
    setup_environment

    # Docker Compose로 서비스 시작
    docker-compose -f docker-compose.dev.yml up -d

    print_step "서비스 시작 대기 중..."
    sleep 10

    # 서비스 상태 확인
    docker-compose -f docker-compose.dev.yml ps

    print_success "개발환경이 시작되었습니다!"
    print_access_info
}

# 개발환경 중지
stop_dev() {
    print_step "개발환경을 중지합니다..."
    docker-compose -f docker-compose.dev.yml down
    print_success "개발환경이 중지되었습니다."
}

# 개발환경 재시작
restart_dev() {
    print_step "개발환경을 재시작합니다..."
    stop_dev
    start_dev
}

# 개발환경 정리
clean_dev() {
    print_step "개발환경을 정리합니다..."

    read -p "⚠️  모든 컨테이너, 볼륨, 네트워크가 삭제됩니다. 계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        print_success "개발환경이 정리되었습니다."
    else
        print_warning "정리가 취소되었습니다."
    fi
}

# 로그 출력
show_logs() {
    print_step "서비스 로그를 출력합니다..."
    docker-compose -f docker-compose.dev.yml logs -f
}

# 상태 확인
show_status() {
    print_step "서비스 상태를 확인합니다..."
    echo ""
    echo "=== Docker Compose 서비스 상태 ==="
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "=== 컨테이너 리소스 사용량 ==="
    docker stats --no-stream $(docker-compose -f docker-compose.dev.yml ps -q) 2>/dev/null || true
}

# 이미지 재빌드
rebuild_images() {
    print_step "Docker 이미지를 재빌드합니다..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    print_success "이미지 재빌드가 완료되었습니다."
}

# 접속 정보 출력
print_access_info() {
    echo ""
    echo "🌐 개발환경 접속 정보:"
    echo "   📱 Frontend:        http://localhost:3000"
    echo "   🚪 API Gateway:     http://localhost:8080"
    echo "   🔐 Auth Service:    http://localhost:3001"
    echo "   📝 Post Service:    http://localhost:3002"
    echo "   💬 Comment Service: http://localhost:3003"
    echo "   🗄️  Adminer:        http://localhost:8081"
    echo ""
    echo "📊 데이터베이스 연결 정보:"
    echo "   🔐 Auth DB:     localhost:5432 (authuser/authpass/authdb)"
    echo "   📝 Post DB:     localhost:5433 (postuser/postpass/postdb)"
    echo "   💬 Comment DB:  localhost:5434 (commentuser/commentpass/commentdb)"
    echo ""
    echo "🔧 유용한 명령어:"
    echo "   서비스 로그:    ./scripts/dev.sh logs"
    echo "   서비스 상태:    ./scripts/dev.sh status"
    echo "   환경 중지:      ./scripts/dev.sh stop"
    echo "   환경 정리:      ./scripts/dev.sh clean"
    echo ""
}

# 헬스체크
health_check() {
    print_step "서비스 헬스체크를 수행합니다..."

    services=("frontend:3000" "api-gateway:8080" "auth-service:3001" "post-service:3002" "comment-service:3003")

    for service in "${services[@]}"; do
        name=$(echo $service | cut -d':' -f1)
        port=$(echo $service | cut -d':' -f2)

        if curl -f http://localhost:$port/health >/dev/null 2>&1; then
            print_success "$name 서비스가 정상 동작 중입니다."
        else
            print_warning "$name 서비스가 응답하지 않습니다."
        fi
    done
}

# 메인 실행 부분
case $COMMAND in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    clean)
        clean_dev
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    build)
        rebuild_images
        ;;
    health)
        health_check
        ;;
    help)
        show_help
        ;;
    *)
        print_error "알 수 없는 명령어: $COMMAND"
        show_help
        exit 1
        ;;
esac