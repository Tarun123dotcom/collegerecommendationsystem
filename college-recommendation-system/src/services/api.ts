import axios, { AxiosResponse } from 'axios';
import { User, College, SearchQuery, SearchFilters, SearchResponse, AuthResponse } from '../types';

// Configure axios with base URL and credentials
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/login', {
      email,
      password,
    });
    return response.data;
  },

  signup: async (name: string, email: string, phno: string, password: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/signup', {
      name,
      email,
      phno,
      password,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/logout');
    localStorage.removeItem('user');
  },
};

// College recommendation APIs
export const collegeAPI = {
  search: async (query: string, filters: SearchFilters = {}): Promise<SearchResponse> => {
    const response: AxiosResponse<SearchResponse> = await api.post('/recommend', {
      query,
      show: filters.ratingFilter || 'default',
    });
    return response.data;
  },

  getPreviousQueries: async (): Promise<SearchQuery[]> => {
    const response: AxiosResponse<{ previous: SearchQuery[] }> = await api.get('/previous');
    return response.data.previous;
  },

  applyFilters: async (filters: SearchFilters, queryId: number): Promise<SearchResponse> => {
    const response: AxiosResponse<SearchResponse> = await api.post('/applyFilter', {
      ...filters,
      q_id: queryId,
    });
    return response.data;
  },

  sortResults: async (sortBy: string, queryId: number): Promise<SearchResponse> => {
    const response: AxiosResponse<SearchResponse> = await api.get('/sort', {
      params: { sort: sortBy, q_id: queryId },
    });
    return response.data;
  },
};

// Voice recognition API
export const voiceAPI = {
  processVoiceCommand: async (audioData: any): Promise<string> => {
    const response: AxiosResponse<string> = await api.post('/voice_command', audioData);
    return response.data;
  },
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const user = localStorage.getItem('user');
  return user !== null;
};

// Utility function to get current user
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Utility function to set current user
export const setCurrentUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export default api;
