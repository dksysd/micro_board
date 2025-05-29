#!/bin/bash

# MicroBoard 플랫폼 빌드 스크립트
set -e

echo "🚀 MicroBoard 플랫폼 빌드를 시작합니다..."

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

# Docker 및 Docker Compose 설치 확인
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

# 환경 변수 설정
setup_environment() {
    print_step "환경 변수 설정 중..."

    # .env 파일이 없으면 생성
    if [ ! -f .env ]; then
        print_warning ".env 파일이 없습니다. 기본 .env 파일을 생성합니다."
        cp .env.example .env
    fi

    # JWT 시크릿 생성 (없는 경우)
    if ! grep -q "JWT_SECRET=" .env; then
        JWT_SECRET=$(openssl rand -base64 32)
        echo "JWT_SECRET=${JWT_SECRET}" >> .env
        print_success "JWT 시크릿이 생성되었습니다."
    fi

    print_success "환경 변수 설정이 완료되었습니다."
}

# Docker 이미지 빌드
build_images() {
    print_step "Docker 이미지 빌드 중..."

    # Auth Service 이미지 빌드
    print_step "Auth Service 이미지 빌드..."
    docker build -t microboard/auth-service:latest ./auth-service
    print_success "Auth Service 이미지 빌드 완료"

    # Post Service 이미지 빌드
    print_step "Post Service 이미지 빌드..."
    docker build -t microboard/post-service:latest ./post-service
    print_success "Post Service 이미지 빌드 완료"

    # Comment Service 이미지 빌드
    print_step "Comment Service 이미지 빌드..."
    docker build -t microboard/comment-service:latest ./comment-service
    print_success "Comment Service 이미지 빌드 완료"

    # Frontend 이미지 빌드
    print_step "Frontend 이미지 빌드..."
    docker build -t microboard/frontend:latest ./frontend
    print_success "Frontend 이미지 빌드 완료"

    print_success "모든 Docker 이미지 빌드가 완료되었습니다."
}

# Docker Swarm 설정
setup_swarm() {
    print_step "Docker Swarm 설정 중..."

    # Swarm 모드가 활성화되어 있는지 확인
    if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
        print_step "Docker Swarm 초기화 중..."
        docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')
        print_success "Docker Swarm이 초기화되었습니다."
    else
        print_success "Docker Swarm이 이미 활성화되어 있습니다."
    fi

    # 네트워크 생성
    print_step "Overlay 네트워크 생성 중..."

    networks=("frontend-net" "backend-net" "db-net")
    for network in "${networks[@]}"; do
        if ! docker network ls | grep -q "$network"; then
            docker network create --driver overlay --attachable "$network"
            print_success "$network 네트워크가 생성되었습니다."
        else
            print_warning "$network 네트워크가 이미 존재합니다."
        fi
    done

    # Docker Secrets 생성
    print_step "Docker Secrets 생성 중..."

    if ! docker secret ls | grep -q "jwt_secret"; then
        JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d '=' -f2)
        echo "$JWT_SECRET" | docker secret create jwt_secret -
        print_success "JWT Secret이 생성되었습니다."
    else
        print_warning "JWT Secret이 이미 존재합니다."
    fi

    # Docker Configs 생성
    print_step "Docker Configs 생성 중..."

    if ! docker config ls | grep -q "nginx_api_gateway_config"; then
        docker config create nginx_api_gateway_config ./api-gateway/nginx.conf
        print_success "Nginx Config가 생성되었습니다."
    else
        print_warning "Nginx Config가 이미 존재합니다."
    fi
}

# 스택 배포
deploy_stack() {
    print_step "Docker Stack 배포 중..."

    docker stack deploy -c docker-stack.yml microboard-app
    print_success "MicroBoard 스택이 배포되었습니다."

    print_step "서비스 상태 확인 중..."
    sleep 10
    docker stack services microboard-app
}

# 배포 상태 확인
check_deployment() {
    print_step "배포 상태 확인 중..."

    # 서비스들이 모두 실행되는지 확인
    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker stack services microboard-app --format "table {{.Name}}\t{{.Replicas}}" | grep -v "0/"; then
            print_success "모든 서비스가 정상적으로 실행 중입니다."
            break
        else
            print_warning "서비스 시작 대기 중... ($attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        fi
    done

    if [ $attempt -gt $max_attempts ]; then
        print_error "일부 서비스가 시작되지 않았습니다."
        docker stack services microboard-app
        exit 1
    fi
}

# 접속 정보 출력
print_access_info() {
    print_success "🎉 MicroBoard 플랫폼이 성공적으로 배포되었습니다!"
    echo ""
    echo "📱 접속 정보:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - API Gateway: http://localhost:80"
    echo "   - Auth Service: http://localhost:3001 (내부)"
    echo "   - Post Service: http://localhost:3002 (내부)"
    echo "   - Comment Service: http://localhost:3003 (내부)"
    echo ""
    echo "🔧 관리 명령어:"
    echo "   - 서비스 상태 확인: docker stack services microboard-app"
    echo "   - 로그 확인: docker service logs microboard-app_[서비스명]"
    echo "   - 스택 제거: docker stack rm microboard-app"
    echo ""
}

# 메인 실행 부분
main() {
    echo "🏗️  MicroBoard Platform Build Script"
    echo "=================================="
    echo ""

    check_requirements
    setup_environment
    build_images
    setup_swarm
    deploy_stack
    check_deployment
    print_access_info
}

# 스크립트 실행
main "$@"