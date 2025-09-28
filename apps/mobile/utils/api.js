import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Get API URL from environment or default to localhost
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add session cookie if available
      const sessionId = await SecureStore.getItemAsync('sessionId');
      if (sessionId) {
        config.headers['Cookie'] = `connect.sid=${sessionId}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Save session cookie if present
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const sessionMatch = setCookieHeader[0]?.match(/connect\.sid=([^;]+)/);
      if (sessionMatch) {
        SecureStore.setItemAsync('sessionId', sessionMatch[1]);
      }
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Clear stored tokens on auth failure
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('sessionId');
      await SecureStore.deleteItemAsync('userData');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.user) {
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.user) {
      await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('sessionId');
      await SecureStore.deleteItemAsync('userData');
    }
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  replitAuth: async () => {
    const response = await api.get('/auth/replit');
    return response.data;
  }
};

// Course APIs
export const courseAPI = {
  getAllCourses: async () => {
    const response = await api.get('/api/courses');
    return response.data;
  },
  
  getCourse: async (courseId) => {
    const response = await api.get(`/api/courses/${courseId}`);
    return response.data;
  },
  
  getEnrolledCourses: async () => {
    const response = await api.get('/api/enrollments');
    return response.data;
  },
  
  enrollInCourse: async (courseId) => {
    const response = await api.post(`/api/courses/${courseId}/enroll`);
    return response.data;
  },
  
  updateProgress: async (courseId, progress) => {
    const response = await api.patch(`/api/courses/${courseId}/progress`, { progress });
    return response.data;
  },
  
  getCourseContent: async (courseId) => {
    const response = await api.get(`/api/courses/${courseId}/content`);
    return response.data;
  }
};

// Market Data APIs
export const marketAPI = {
  getMarketData: async (symbols) => {
    const response = await api.get('/api/market/quotes', {
      params: { symbols: symbols.join(',') }
    });
    return response.data;
  },
  
  getHistoricalData: async (symbol, period = '1d') => {
    const response = await api.get(`/api/market/historical/${symbol}`, {
      params: { period }
    });
    return response.data;
  },
  
  searchSymbols: async (query) => {
    const response = await api.get('/api/market/search', {
      params: { q: query }
    });
    return response.data;
  },
  
  getIndices: async () => {
    const response = await api.get('/api/market/indices');
    return response.data;
  }
};

// Dashboard APIs
export const dashboardAPI = {
  getDashboardData: async () => {
    const response = await api.get('/api/dashboard');
    return response.data;
  },
  
  getActivity: async () => {
    const response = await api.get('/api/activity');
    return response.data;
  },
  
  getProgress: async () => {
    const response = await api.get('/api/progress');
    return response.data;
  }
};

// User APIs
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/api/user/profile');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.patch('/api/user/profile', profileData);
    return response.data;
  },
  
  getNotifications: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  }
};

// Quiz APIs
export const quizAPI = {
  getQuizzesByCourse: async (courseId) => {
    const response = await api.get(`/api/courses/${courseId}/quizzes`);
    return response.data;
  },
  
  getQuiz: async (quizId) => {
    const response = await api.get(`/api/quizzes/${quizId}`);
    return response.data;
  },
  
  submitQuiz: async (quizId, answers) => {
    const response = await api.post(`/api/quizzes/${quizId}/submit`, { answers });
    return response.data;
  },
  
  getQuizResults: async (quizId) => {
    const response = await api.get(`/api/quizzes/${quizId}/results`);
    return response.data;
  }
};

// AI Chat API
export const chatAPI = {
  sendMessage: async (message) => {
    const response = await api.post('/api/ai/chat', { message });
    return response.data;
  },
  
  getChatHistory: async () => {
    const response = await api.get('/api/ai/chat/history');
    return response.data;
  }
};

export default api;