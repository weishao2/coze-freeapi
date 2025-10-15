import { api } from '../utils/request';
import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  ChangePasswordRequest, 
  ApiResponse 
} from '../types';

// 用户登录
export const login = async (data: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> => {
  return api.post('/auth/login', data);
};

// 用户注册
export const register = async (data: RegisterRequest): Promise<ApiResponse<{ user: User; token: string }>> => {
  return api.post('/auth/register', data);
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  return api.get('/auth/me');
};

// 修改密码
export const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse> => {
  return api.put('/auth/password', data);
};

// 退出登录
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// 检查是否已登录
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

// 获取存储的用户信息
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('解析用户信息失败:', error);
      localStorage.removeItem('user');
    }
  }
  return null;
};

// 存储用户信息
export const setStoredUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

// 获取存储的 token
export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

// 存储 token
export const setStoredToken = (token: string): void => {
  localStorage.setItem('token', token);
};