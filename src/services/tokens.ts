import { api } from '../utils/request';
import type { 
  Token, 
  CreateTokenRequest, 
  UpdateTokenRequest, 
  ApiResponse 
} from '../types';

// 获取所有 Token
export const getTokens = async (): Promise<ApiResponse<Token[]>> => {
  return api.get('/tokens');
};

// 创建新 Token
export const createToken = async (data: CreateTokenRequest): Promise<ApiResponse<Token>> => {
  return api.post('/tokens', data);
};

// 更新 Token
export const updateToken = async (id: number, data: UpdateTokenRequest): Promise<ApiResponse<Token>> => {
  return api.put(`/tokens/${id}`, data);
};

// 删除 Token
export const deleteToken = async (id: number): Promise<ApiResponse> => {
  return api.delete(`/tokens/${id}`);
};

// 切换 Token 状态
export const toggleTokenStatus = async (id: number, is_active: boolean): Promise<ApiResponse<Token>> => {
  return api.put(`/tokens/${id}`, { is_active });
};