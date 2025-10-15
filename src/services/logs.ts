import { api } from '../utils/request';
import type { 
  WorkflowLog, 
  LogsQuery, 
  LogsResponse, 
  LogStats, 
  ApiResponse 
} from '../types';

// 获取执行日志列表
export const getLogs = async (params: LogsQuery = {}): Promise<ApiResponse<LogsResponse>> => {
  return api.get('/logs', { params });
};

// 获取单个日志详情
export const getLogDetail = async (id: number): Promise<ApiResponse<WorkflowLog>> => {
  return api.get(`/logs/${id}`);
};

// 获取日志统计信息
export const getLogStats = async (days: number = 7): Promise<ApiResponse<LogStats>> => {
  return api.get('/logs/stats/summary', { params: { days } });
};

// 删除日志（批量删除）
export const deleteLogs = async (ids: number[]): Promise<ApiResponse> => {
  return api.delete('/logs', { data: { ids } });
};

// 删除指定天数前的日志
export const deleteLogsByDays = async (days: number): Promise<ApiResponse> => {
  return api.delete('/logs', { data: { days } });
};