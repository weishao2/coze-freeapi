import { api } from '../utils/request';
import type { 
  Workflow, 
  CreateWorkflowRequest, 
  UpdateWorkflowRequest, 
  ApiResponse 
} from '../types';

// 获取所有工作流
export const getWorkflows = async (): Promise<ApiResponse<Workflow[]>> => {
  return api.get('/workflows');
};

// 获取单个工作流
export const getWorkflow = async (workflowId: string): Promise<ApiResponse<Workflow>> => {
  return api.get(`/workflows/${workflowId}`);
};

// 创建新工作流
export const createWorkflow = async (data: CreateWorkflowRequest): Promise<ApiResponse<Workflow>> => {
  return api.post('/workflows', data);
};

// 更新工作流
export const updateWorkflow = async (workflowId: string, data: UpdateWorkflowRequest): Promise<ApiResponse<Workflow>> => {
  return api.put(`/workflows/${workflowId}`, data);
};

// 删除工作流
export const deleteWorkflow = async (workflowId: string): Promise<ApiResponse> => {
  return api.delete(`/workflows/${workflowId}`);
};

// 切换工作流状态
export const toggleWorkflowStatus = async (workflowId: string, is_active: boolean): Promise<ApiResponse<Workflow>> => {
  return api.put(`/workflows/${workflowId}`, { is_active });
};