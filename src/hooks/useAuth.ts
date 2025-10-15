import { useState, useEffect } from 'react';
import { message } from 'antd';
import { 
  login as loginApi, 
  register as registerApi, 
  getCurrentUser, 
  logout as logoutApi,
  isAuthenticated,
  getStoredUser,
  setStoredUser,
  setStoredToken
} from '../services/auth';
import type { User, LoginRequest, RegisterRequest } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // 初始化用户状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          // 尝试从本地存储获取用户信息
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // 如果本地没有用户信息，从服务器获取
            const response = await getCurrentUser();
            if (response.success && response.data) {
              setUser(response.data);
              setStoredUser(response.data);
            }
          }
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        // 如果获取用户信息失败，清除本地存储
        logoutApi();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录
  const login = async (data: LoginRequest): Promise<boolean> => {
    setLoginLoading(true);
    try {
      const response = await loginApi(data);
      console.log('登录响应:', response);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        setUser(userData);
        setStoredUser(userData);
        setStoredToken(token);
        message.success(response.message || '登录成功');
        return true;
      } else if (response.success && response.data?.token && response.data?.user) {
        // 兼容直接返回 token 和 user 的情况
        setUser(response.data.user);
        setStoredUser(response.data.user);
        setStoredToken(response.data.token);
        message.success(response.message || '登录成功');
        return true;
      }
      
      message.error(response.message || '登录失败');
      return false;
    } catch (error: any) {
      console.error('登录错误:', error);
      const errorMessage = error?.message || '登录失败，请稍后重试';
      message.error(errorMessage);
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  // 注册
  const register = async (data: RegisterRequest): Promise<boolean> => {
    setRegisterLoading(true);
    try {
      const response = await registerApi(data);
      console.log('注册响应:', response);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        setUser(userData);
        setStoredUser(userData);
        setStoredToken(token);
        message.success(response.message || '注册成功');
        return true;
      } else if (response.success && response.data?.token && response.data?.user) {
        // 兼容直接返回 token 和 user 的情况
        setUser(response.data.user);
        setStoredUser(response.data.user);
        setStoredToken(response.data.token);
        message.success(response.message || '注册成功');
        return true;
      }
      
      message.error(response.message || '注册失败');
      return false;
    } catch (error: any) {
      console.error('注册错误:', error);
      const errorMessage = error?.message || '注册失败，请稍后重试';
      message.error(errorMessage);
      return false;
    } finally {
      setRegisterLoading(false);
    }
  };

  // 退出登录
  const logout = () => {
    setUser(null);
    logoutApi();
    message.success('已退出登录');
  };

  // 更新用户信息
  const updateUser = (userData: User) => {
    setUser(userData);
    setStoredUser(userData);
  };

  // 刷新用户信息
  const refreshUser = async (): Promise<boolean> => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        setStoredUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      return false;
    }
  };

  return {
    user,
    loading,
    loginLoading,
    registerLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  };
};