import axios from 'axios';

// API 기본 URL 설정 - 안전한 환경변수 접근
const getApiBaseUrl = () => {
    // 개발환경에서 process.env가 undefined인 경우를 대비
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }

    // 브라우저 환경에서 window 객체를 통한 접근 시도
    if (typeof window !== 'undefined' && window.ENV && window.ENV.REACT_APP_API_URL) {
        return window.ENV.REACT_APP_API_URL;
    }

    // 기본값 - 현재 호스트의 8080 포트 사용
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${currentHost}:8080`;
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL); // 디버깅용

// Axios 인스턴스 생성
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    // 개발환경에서 CORS 문제 해결을 위해 추가
    withCredentials: false, // 필요시 true로 변경
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API 요청:', config.method?.toUpperCase(), config.url); // 디버깅용
        return config;
    },
    (error) => {
        console.error('요청 인터셉터 에러:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
    (response) => {
        console.log('API 응답 성공:', response.status, response.config.url); // 디버깅용
        return response;
    },
    (error) => {
        console.error('API 응답 에러:', error.response?.status, error.message, error.config?.url);

        if (error.response?.status === 401) {
            // 토큰이 만료되거나 유효하지 않은 경우
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.error("Unauthorized or Token Expired. Logging out.");

            // 로그아웃 이벤트 발생
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
    }
);

// 인증 관련 API
export const authAPI = {
    signup: async (userData) => {
        const response = await api.post('/api/auth/signup', userData);
        return response.data;
    },
    signin: async (credentials) => {
        const response = await api.post('/api/auth/signin', credentials);
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get('/api/auth/profile');
        return response.data;
    },
    verifyToken: async () => {
        const response = await api.post('/api/auth/verify');
        return response.data;
    },
};

// 게시글 관련 API
export const postAPI = {
    getPosts: async (page = 1, limit = 10, searchQuery = '') => {
        let url = `/api/posts?page=${page}&limit=${limit}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const response = await api.get(url);
        return response.data;
    },
    getPost: async (postId) => {
        const response = await api.get(`/api/posts/${postId}`);
        return response.data;
    },
    createPost: async (postData) => {
        const response = await api.post('/api/posts', postData);
        return response.data;
    },
    updatePost: async (postId, postData) => {
        const response = await api.put(`/api/posts/${postId}`, postData);
        return response.data;
    },
    deletePost: async (postId) => {
        const response = await api.delete(`/api/posts/${postId}`);
        return response.data;
    },
    toggleLikePost: async (postId) => {
        const response = await api.post(`/api/posts/${postId}/like`);
        return response.data;
    },
};

// 댓글 관련 API
export const commentAPI = {
    getComments: async (postId, page = 1, limit = 20) => {
        const response = await api.get(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
        return response.data;
    },
    createComment: async (postId, commentData) => {
        const response = await api.post(`/api/posts/${postId}/comments`, commentData);
        return response.data;
    },
    updateComment: async (commentId, commentData) => {
        const response = await api.put(`/api/comments/${commentId}`, commentData);
        return response.data;
    },
    deleteComment: async (commentId) => {
        const response = await api.delete(`/api/comments/${commentId}`);
        return response.data;
    },
    getComment: async (commentId) => {
        const response = await api.get(`/api/comments/${commentId}`);
        return response.data;
    },
    likeComment: async (commentId) => {
        const response = await api.post(`/api/comments/${commentId}/like`);
        return response.data;
    },
    dislikeComment: async (commentId) => {
        const response = await api.post(`/api/comments/${commentId}/dislike`);
        return response.data;
    },
};

// 사용자 관련 API
export const userAPI = {
    getUser: async (userId) => {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
    },
    getUsers: async (userIds) => {
        const response = await api.post('/api/users/bulk', {userIds});
        return response.data;
    },
};

// 유틸리티 함수들
export const apiUtils = {
    getErrorMessage: (error) => {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
        return '알 수 없는 오류가 발생했습니다.';
    },
    isSuccessResponse: (response) => {
        return response && response.status >= 200 && response.status < 300;
    },
    setToken: (token) => {
        localStorage.setItem('token', token);
    },
    getToken: () => {
        return localStorage.getItem('token');
    },
    removeToken: () => {
        localStorage.removeItem('token');
    },
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
    },
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    removeUser: () => {
        localStorage.removeItem('user');
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeUser();
        window.dispatchEvent(new CustomEvent('auth:logout'));
    },
};

export default api;