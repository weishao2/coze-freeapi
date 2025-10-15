// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// Token 相关类型
export interface Token {
  id: number;
  user_id: number;
  token_name: string;
  token_value: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTokenRequest {
  token_name: string;
  token_value: string;
  description?: string;
}

export interface UpdateTokenRequest {
  token_name?: string;
  token_value?: string;
  description?: string;
  is_active?: boolean;
}

// 工作流相关类型
export interface Workflow {
  id: number;
  workflow_id: string;
  user_id: number;
  workflow_name: string;
  parameters?: any[];
  method?: 'GET' | 'POST';
  output_format?: string;
  token: string;
  is_async: boolean;
  description?: string;
  default_params?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  workflow_name: string;
  workflow_id: string;
  parameters?: any[];
  method?: 'GET' | 'POST';
  output_format?: string;
  token: string;
  is_async?: boolean;
  description?: string;
  default_params?: Record<string, any>;
}

export interface UpdateWorkflowRequest {
  workflow_name?: string;
  workflow_id?: string;
  parameters?: any[];
  method?: 'GET' | 'POST';
  output_format?: string;
  token?: string;
  is_async?: boolean;
  description?: string;
  default_params?: Record<string, any>;
  is_active?: boolean;
}

// 执行日志相关类型
export interface WorkflowLog {
  id: number;
  user_id: number;
  workflow_id: string;
  workflow_name?: string;
  request_method: 'GET' | 'POST';
  request_params: Record<string, any>;
  response_data: any;
  status: 'success' | 'error' | 'timeout';
  error_message?: string;
  execution_time: number;
  created_at: string;
}

export interface LogsQuery {
  page?: number;
  limit?: number;
  status?: 'success' | 'error' | 'timeout';
  workflow_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface LogsResponse {
  logs: WorkflowLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 统计相关类型
export interface LogStats {
  summary: {
    total_calls: number;
    success_calls: number;
    error_calls: number;
    timeout_calls: number;
    success_rate: string;
    avg_execution_time: number;
    max_execution_time: number;
    min_execution_time: number;
  };
  daily_stats: Array<{
    date: string;
    total_calls: number;
    success_calls: number;
    error_calls: number;
    avg_execution_time: number;
  }>;
  workflow_stats: Array<{
    workflow_id: string;
    workflow_name: string;
    total_calls: number;
    success_calls: number;
    avg_execution_time: number;
  }>;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 分页参数类型
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 表格列类型
export interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter?: boolean | ((a: any, b: any) => number);
  filters?: Array<{ text: string; value: any }>;
  onFilter?: (value: any, record: any) => boolean;
}

// 表单验证规则类型
export interface FormRule {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (rule: any, value: any) => Promise<void>;
}

// 菜单项类型
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  path?: string;
}

// 路由类型
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  children?: RouteConfig[];
}

// 主题配置类型
export interface ThemeConfig {
  colorPrimary: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  borderRadius: number;
}

// 应用状态类型
export interface AppState {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  collapsed: boolean;
}

// 操作类型
export type ActionType = 'create' | 'edit' | 'delete' | 'view';

// 状态类型
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'processing' | 'default';