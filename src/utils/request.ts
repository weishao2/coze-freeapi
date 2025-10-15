import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    
    // 如果是下载文件等特殊情况，直接返回
    if (response.config.responseType === 'blob') {
      return response;
    }
    
    // 统一处理响应数据
    // 只有当 success 明确为 false 时才认为是错误
    if (data.success === false) {
      const errorMessage = data.message || '请求失败';
      message.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    
    // 返回完整的响应数据，包括 success、message、data 等字段
    return data;
  },
  (error) => {
    console.error('响应拦截器错误:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      // 处理后端返回的错误信息
      let errorMessage = '请求失败';
      if (data && data.message) {
        errorMessage = data.message;
      } else if (data && typeof data === 'string') {
        errorMessage = data;
      }
      
      switch (status) {
        case 401:
          errorMessage = data?.message || '登录已过期，请重新登录';
          message.error(errorMessage);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // 跳转到登录页
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = data?.message || '没有权限访问该资源';
          message.error(errorMessage);
          break;
        case 404:
          errorMessage = data?.message || '请求的资源不存在';
          message.error(errorMessage);
          break;
        case 409:
          errorMessage = data?.message || '资源冲突';
          message.error(errorMessage);
          break;
        case 500:
          errorMessage = data?.message || '服务器内部错误';
          message.error(errorMessage);
          break;
        default:
          message.error(errorMessage);
      }
      
      // 返回一个包含错误信息的对象，而不是直接 reject
      return Promise.reject({
        success: false,
        message: errorMessage,
        status
      });
    } else if (error.request) {
      const errorMessage = '网络连接失败，请检查网络';
      message.error(errorMessage);
      return Promise.reject({
        success: false,
        message: errorMessage
      });
    } else {
      const errorMessage = '请求配置错误';
      message.error(errorMessage);
      return Promise.reject({
        success: false,
        message: errorMessage
      });
    }
  }
);

// 封装常用的请求方法
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.get(url, config);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.post(url, data, config);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.put(url, data, config);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.delete(url, config);
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request.patch(url, data, config);
  }
};

export default request;