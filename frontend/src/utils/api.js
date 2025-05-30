import axios from 'axios';

// API 기본 URL 설정 - 프론트엔드 프록시 사용 버전
const getApiBaseUrl = () => {
    // 프론트엔드 nginx가 /api/ 경로를 API Gateway로 프록시하므로
    // 모든 요청을 상대 경로로 처리 (같은 오리진)

    console.log('🌐 프록시 모드: 모든 API 요청을 프론트엔드 nginx를 통해 프록시');
    return ''; // 빈 문자열 = 상대 경로 사용
};

const API_BASE_URL = getApiBaseUrl();

console.log('🌐 Final API Base URL:', API_BASE_URL || 'relative path (proxy mode)');

// Axios 인스턴스 생성 - 프록시 최적화 버전
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 프록시 체인 고려하여 타임아웃 증가
    headers: {
        'Content-Type': 'application/json',
    },
    // 🔥 중요: 프록시 모드에서는 withCredentials가 필요 없을 수 있음
    // 하지만 안전하게 유지
    withCredentials: false, // 프록시를 통해 같은 오리진이므로 불필요
});

// 요청 인터셉터 - 프록시 모드 최적화
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        // 🔥 토큰이 있을 때만 Authorization 헤더 추가
        // 이제 CORS 문제가 없으므로 모든 경우에 안전하게 추가 가능
        if (token && token.trim() !== '') {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Authorization 헤더 추가됨 (프록시 모드)');
        } else {
            // 토큰이 없으면 Authorization 헤더 제거
            delete config.headers.Authorization;
            console.log('🚫 Authorization 헤더 없음 (토큰 없음)');
        }

        // 디버깅을 위한 로깅
        console.log('🚀 API 요청 (프록시 모드):', {
            method: config.method?.toUpperCase(),
            url: config.url,
            fullUrl: window.location.origin + (config.url || ''),
            hasAuth: !!config.headers.Authorization,
            proxyMode: true,
            corsIssue: 'NONE (same origin)',
            headers: {
                'Content-Type': config.headers['Content-Type'],
                'Authorization': config.headers.Authorization ? 'Bearer ***' : 'None',
            }
        });

        return config;
    },
    (error) => {
        console.error('❌ 요청 인터셉터 에러:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 프록시 모드 최적화
api.interceptors.response.use(
    (response) => {
        console.log('✅ API 응답 성공 (프록시 모드):', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            dataSize: response.data ? JSON.stringify(response.data).length : 0,
            proxyHeaders: {
                'x-debug-proxy': response.headers['x-debug-proxy'],
                'x-debug-service': response.headers['x-debug-service'],
                'x-debug-upstream': response.headers['x-debug-upstream']
            }
        });
        return response;
    },
    (error) => {
        // 상세한 에러 로깅
        console.error('❌ API 응답 에러 (프록시 모드):', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            url: error.config?.url,
            errorCode: error.code,
            responseData: error.response?.data,
            proxyDebugHeaders: {
                'x-debug-proxy': error.response?.headers?.['x-debug-proxy'],
                'x-debug-error': error.response?.headers?.['x-debug-error'],
                'x-debug-service': error.response?.headers?.['x-debug-service']
            }
        });

        // 401 Unauthorized 처리
        if (error.response?.status === 401) {
            console.warn('🔐 인증 만료 - 로그아웃 처리');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        return Promise.reject(error);
    }
);

// 인증 관련 API - 프록시 모드에서 모든 API 동일하게 처리
export const authAPI = {
    signup: async (userData) => {
        if (!userData.email || !userData.password) {
            throw new Error('이메일과 비밀번호는 필수입니다.');
        }

        console.log('📝 회원가입 요청 (프록시 모드)');
        const response = await api.post('/api/auth/signup', userData);
        return response.data;
    },
    signin: async (credentials) => {
        if (!credentials.email || !credentials.password) {
            throw new Error('이메일과 비밀번호는 필수입니다.');
        }

        console.log('🔑 로그인 요청 (프록시 모드):', { email: credentials.email });
        const response = await api.post('/api/auth/signin', credentials);
        return response.data;
    },
    getProfile: async () => {
        console.log('👤 프로필 조회 요청 (프록시 모드)');
        const response = await api.get('/api/auth/profile');
        return response.data;
    }
};

// 게시글 관련 API - 프록시 모드에서는 공개/인증 구분 불필요
export const postAPI = {
    getPosts: async (page = 1, limit = 10, searchQuery = '') => {
        let url = `/api/posts?page=${page}&limit=${limit}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        console.log('📄 게시글 목록 조회 (프록시 모드):', { page, limit, searchQuery });
        const response = await api.get(url);
        return response.data;
    },

    getPost: async (postId) => {
        console.log('📄 게시글 상세 조회 (프록시 모드):', postId);
        const response = await api.get(`/api/posts/${postId}`);
        return response.data;
    },

    createPost: async (postData) => {
        console.log('📝 게시글 작성 (프록시 모드)');
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('로그인이 필요합니다.');
        }

        const response = await api.post('/api/posts', postData);
        return response.data;
    }
};

export const commentAPI = {
    getComments: async (postId, page = 1, limit = 20) => {
        console.log('💬 댓글 목록 조회 (프록시 모드):', { postId, page, limit });
        const response = await api.get(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
        return response.data;
    },
    createComment: async (postId, commentData) => {
        console.log('💬 댓글 작성 (프록시 모드):', postId);
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('로그인이 필요합니다.');
        }

        const response = await api.post(`/api/posts/${postId}/comments`, commentData);
        return response.data;
    }
};

// 유틸리티 함수들
export const apiUtils = {
    getErrorMessage: (error) => {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
        if (error.message) {
            return error.message;
        }
        return '알 수 없는 오류가 발생했습니다.';
    },
    setToken: (token) => {
        localStorage.setItem('token', token);
        console.log('🔑 토큰 저장됨 (프록시 모드)');
    },
    getToken: () => {
        const token = localStorage.getItem('token');
        console.log('🔑 토큰 조회 (프록시 모드):', token ? '존재' : '없음');
        return token;
    },
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('👤 사용자 정보 저장됨 (프록시 모드)');
    },
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('🚪 로그아웃 완료 (프록시 모드)');
        window.dispatchEvent(new CustomEvent('auth:logout'));
    },
};