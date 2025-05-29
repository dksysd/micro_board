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
            // App.js에서 user 상태를 null로 설정하고 로그인 페이지로 리디렉션해야 함
            // window.location.href = '/login'; // 직접적인 페이지 이동보다는 상태 관리를 통해 처리하는 것이 좋음
            // 예를 들어, 커스텀 이벤트를 발생시키거나, App 레벨에서 이 에러를 캐치하여 처리
            console.error("Unauthorized or Token Expired. Logging out.");
            //  App.js에서 이 에러를 감지하고 로그아웃 처리를 하도록 유도할 수 있습니다.
            //  Event emitter 또는 redux/context dispatch 등을 사용할 수 있습니다.
            //  여기서는 일단 로컬 스토리지 정리만 합니다.
        }
        return Promise.reject(error);
    }
);

// 인증 관련 API
export const authAPI = {
    signup: async (userData) => {
        const response = await api.post('/api/auth/signup', userData);
        return response.data; // Expects { user: {}, token: "..." }
    },
    signin: async (credentials) => {
        const response = await api.post('/api/auth/signin', credentials);
        return response.data; // Expects { user: {}, token: "..." }
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
        return response.data; // Expects { posts: [], totalPages: X, currentPage: Y }
    },
    getPost: async (postId) => {
        const response = await api.get(`/api/posts/${postId}`);
        return response.data; // Expects full post object with author, etc.
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
    // 게시글 좋아요/싫어요 (토글 방식 또는 별도 API)
    toggleLikePost: async (postId) => {
        const response = await api.post(`/api/posts/${postId}/like`); // URL은 API 설계에 따라 다를 수 있음
        return response.data; // Expects updated post or { likes: count, likedByCurrentUser: boolean }
    },
};

// 댓글 관련 API
export const commentAPI = {
    getComments: async (postId, page = 1, limit = 20) => {
        const response = await api.get(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`);
        return response.data; // Expects { comments: [], totalPages: X, currentPage: Y }
    },
    createComment: async (postId, commentData) => {
        const response = await api.post(`/api/posts/${postId}/comments`, commentData);
        return response.data; // Expects the newly created comment object
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
    // 댓글 좋아요/싫어요
    likeComment: async (commentId) => {
        const response = await api.post(`/api/comments/${commentId}/like`);
        return response.data; // Expects updated comment or { likes: count }
    },
    dislikeComment: async (commentId) => {
        const response = await api.post(`/api/comments/${commentId}/dislike`);
        return response.data; // Expects updated comment or { dislikes: count }
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
        localStorage.removeItem('user');
        // Consider redirecting or emitting an event for App.js to handle logout state
    },
};

export default api;