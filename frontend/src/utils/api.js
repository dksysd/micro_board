import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Axios 인스턴스 생성
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // 토큰이 만료되거나 유효하지 않은 경우
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 인증 관련 API
export const authAPI = {
    // 회원가입
    signup: async (userData) => {
        const response = await api.post('/api/auth/signup', userData);
        return response.data;
    },

    // 로그인
    signin: async (credentials) => {
        const response = await api.post('/api/auth/signin', credentials);
        return response.data;
    },

    // 프로필 조회
    getProfile: async () => {
        const response = await api.get('/api/auth/profile');
        return response.data;
    },

    // 토큰 검증
    verifyToken: async () => {
        const response = await api.post('/api/auth/verify');
        return response.data;
    },
};

// 게시글 관련 API
export const postAPI = {
    // 게시글 목록 조회
    getPosts: async (page = 1, limit = 10) => {
        const response = await api.get(`/api/posts?page=${page}&limit=${limit}`);
        return response.data;
    },

    // 게시글 상세 조회
    getPost: async (postId) => {
        const response = await api.get(`/api/posts/${postId}`);
        return response.data;
    },

    // 게시글 작성
    createPost: async (postData) => {
        const response = await api.post('/api/posts', postData);
        return response.data;
    },

    // 게시글 수정
    updatePost: async (postId, postData) => {
        const response = await api.put(`/api/posts/${postId}`, postData);
        return response.data;
    },

    // 게시글 삭제
    deletePost: async (postId) => {
        const response = await api.delete(`/api/posts/${postId}`);
        return response.data;
    },
};

// 댓글 관련 API
export const commentAPI = {
    // 댓글 목록 조회
    getComments: async (postId, page = 1, limit = 20) => {
        const response = await api.get(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
        return response.data;
    },

    // 댓글 작성
    createComment: async (postId, commentData) => {
        const response = await api.post(`/api/posts/${postId}/comments`, commentData);
        return response.data;
    },

    // 댓글 수정
    updateComment: async (commentId, commentData) => {
        const response = await api.put(`/api/comments/${commentId}`, commentData);
        return response.data;
    },

    // 댓글 삭제
    deleteComment: async (commentId) => {
        const response = await api.delete(`/api/comments/${commentId}`);
        return response.data;
    },

    // 댓글 상세 조회
    getComment: async (commentId) => {
        const response = await api.get(`/api/comments/${commentId}`);
        return response.data;
    },
};

// 사용자 관련 API
export const userAPI = {
    // 사용자 정보 조회
    getUser: async (userId) => {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
    },

    // 여러 사용자 정보 조회
    getUsers: async (userIds) => {
        const response = await api.post('/api/users/bulk', {userIds});
        return response.data;
    },
};

// 유틸리티 함수들
export const apiUtils = {
    // 에러 메시지 추출
    getErrorMessage: (error) => {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
        return '알 수 없는 오류가 발생했습니다.';
    },

    // API 응답 성공 여부 확인
    isSuccessResponse: (response) => {
        return response && response.status >= 200 && response.status < 300;
    },

    // 토큰 저장
    setToken: (token) => {
        localStorage.setItem('token', token);
    },

    // 토큰 조회
    getToken: () => {
        return localStorage.getItem('token');
    },

    // 토큰 삭제
    removeToken: () => {
        localStorage.removeItem('token');
    },

    // 사용자 정보 저장
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // 사용자 정보 조회
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // 사용자 정보 삭제
    removeUser: () => {
        localStorage.removeItem('user');
    },

    // 로그아웃
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};

export default api;