import { Router, Request, Response } from 'express';
import axios from 'axios';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Coze API 转换服务 - 核心功能
// 支持 GET 和 POST 请求，将 Coze 工作流 API 包装成更灵活的接口

// GET 方式执行工作流
router.get('/:workflowId', async (req: Request, res: Response) => {
  await executeWorkflow(req, res, 'GET');
});

// POST 方式执行工作流
router.post('/:workflowId', async (req: Request, res: Response) => {
  await executeWorkflow(req, res, 'POST');
});

// 核心执行函数
async function executeWorkflow(req: Request, res: Response, requestMethod: 'GET' | 'POST') {
  const startTime = Date.now();
  let userId: number | undefined;
  let workflowConfig: any;

  try {
    const { workflowId } = req.params;
    
    // 从查询参数或请求体获取参数
    const parameters = requestMethod === 'GET' ? req.query : req.body;
    
    // 从 Authorization header 获取用户信息（可选）
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // 这里可以解析 JWT 获取用户信息，但为了兼容性，我们也支持匿名调用
        const token = authHeader.split(' ')[1];
        // 简单的 token 验证逻辑可以在这里添加
      } catch (error) {
        // 忽略认证错误，允许匿名调用
      }
    }

    // 查找工作流配置
    const [workflowRows] = await pool.execute(
      'SELECT * FROM workflows WHERE workflow_id = ? LIMIT 1',
      [workflowId]
    );

    const workflows = workflowRows as any[];
    if (workflows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工作流配置不存在'
      });
    }

    workflowConfig = workflows[0];
    userId = workflowConfig.user_id;

    // 记录请求信息（允许任何请求方法调用工作流）
    console.log(`执行工作流 ${workflowId}:`, {
      requestMethod,
      configuredMethod: workflowConfig.method,
      userId: workflowConfig.user_id,
      workflowName: workflowConfig.workflow_name,
      parameters: requestMethod === 'GET' ? req.query : req.body
    });

    // 合并默认参数和请求参数
    let defaultParams = {};
    try {
      defaultParams = JSON.parse(workflowConfig.parameters || '{}');
    } catch (error) {
      console.error('解析默认参数失败:', error);
    }

    const finalParams = { ...defaultParams, ...parameters };

    // 调用 Coze API
    const cozeResponse = await callCozeAPI(workflowConfig, finalParams);
    
    // 转换响应数据格式
    const transformedResponse = transformResponse(cozeResponse);

    // 记录执行日志
    const executionTime = Date.now() - startTime;
    await logExecution(userId || 0, workflowId, finalParams, transformedResponse, executionTime, 'success', undefined, requestMethod);

    // 返回转换后的响应
    res.json(transformedResponse);

  } catch (error) {
    console.error('执行工作流错误:', error);
    
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    // 记录错误日志
    if (req.params.workflowId) {
      await logExecution(
        userId || 0, 
        req.params.workflowId, 
        requestMethod === 'GET' ? req.query : req.body, 
        null, 
        executionTime, 
        'error',
        errorMessage,
        requestMethod
      );
    }

    // 返回错误响应
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      
      res.status(status).json({
        success: false,
        message: `Coze API 调用失败: ${message}`,
        error: error.response?.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: errorMessage
      });
    }
  }
}

// 调用 Coze API
async function callCozeAPI(workflowConfig: any, parameters: any) {
  const cozeApiUrl = process.env.COZE_API_BASE_URL || 'https://api.coze.cn/v1';
  
  // 验证和格式化 token
  let token = workflowConfig.token;
  if (!token) {
    throw new Error('Token 不能为空');
  }
  
  console.log('原始 token:', token);
  
  // 移除可能存在的 api 前缀
  if (token.startsWith('api ')) {
    token = token.substring(4); // 移除 "api " 前缀
    console.log('移除 api 前缀后的 token:', token);
  }
  
  // 确保 token 格式正确，避免重复添加 Bearer 前缀
  if (token.startsWith('Bearer ')) {
    // 如果已经包含 Bearer 前缀，直接使用
    console.log('Token 已包含 Bearer 前缀');
  } else {
    // 如果没有 Bearer 前缀，添加它
    token = `Bearer ${token}`;
    console.log('已为 Token 添加 Bearer 前缀');
  }
  
  console.log('最终的 Authorization header:', token.substring(0, 30) + '...');
  
  const requestData = {
    workflow_id: workflowConfig.workflow_id,
    parameters: parameters,
    is_async: workflowConfig.is_async || false
  };

  const response = await axios.post(
    `${cozeApiUrl}/workflow/run`,
    requestData,
    {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60秒超时
    }
  );

  return response.data;
}

// 转换响应数据格式
function transformResponse(cozeResponse: any) {
  try {
    // 如果 data 字段是字符串，尝试解析为 JSON
    if (cozeResponse.data && typeof cozeResponse.data === 'string') {
      try {
        cozeResponse.data = JSON.parse(cozeResponse.data);
      } catch (parseError) {
        // 如果解析失败，保持原始字符串
        console.warn('无法解析 data 字段为 JSON:', parseError);
      }
    }

    return {
      success: true,
      code: cozeResponse.code || 0,
      data: cozeResponse.data,
      debug_url: cozeResponse.debug_url,
      message: cozeResponse.msg || cozeResponse.message || '',
      usage: cozeResponse.usage
    };
  } catch (error) {
    console.error('转换响应格式错误:', error);
    return {
      success: false,
      message: '响应格式转换失败',
      original_response: cozeResponse
    };
  }
}

// 记录执行日志
async function logExecution(
  userId: number, 
  workflowId: string, 
  requestParams: any, 
  responseData: any, 
  executionTime: number, 
  status: 'success' | 'error' | 'timeout',
  errorMessage?: string,
  requestMethod?: string
) {
  try {
    console.log('尝试记录执行日志:', {
      userId,
      workflowId,
      requestParams: JSON.stringify(requestParams),
      responseData: responseData ? JSON.stringify(responseData).substring(0, 100) + '...' : null,
      executionTime,
      status,
      errorMessage,
      requestMethod
    });
    
    await pool.execute(
      'INSERT INTO workflow_logs (user_id, workflow_id, request_params, response_data, execution_time, status, error_message, request_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        workflowId,
        JSON.stringify(requestParams),
        responseData ? JSON.stringify(responseData) : null,
        executionTime,
        status,
        errorMessage || null,
        requestMethod || 'UNKNOWN'
      ]
    );
    
    console.log('执行日志记录成功');
  } catch (error) {
    console.error('记录执行日志失败:', error);
    console.error('错误详情:', error instanceof Error ? error.message : '未知错误');
  }
}

// 获取工作流执行日志
router.get('/logs/:workflowId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // 检查工作流是否属于当前用户
    const [workflowRows] = await pool.execute(
      'SELECT id FROM workflows WHERE workflow_id = ? AND user_id = ?',
      [workflowId, userId]
    );

    if ((workflowRows as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: '工作流不存在或无权限访问'
      });
    }

    // 获取日志列表
    const [logRows] = await pool.execute(
      'SELECT * FROM workflow_logs WHERE workflow_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [workflowId, userId, Number(limit), offset]
    );

    // 获取总数
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM workflow_logs WHERE workflow_id = ? AND user_id = ?',
      [workflowId, userId]
    );

    const total = (countRows as any[])[0].total;

    res.json({
      success: true,
      data: {
        logs: logRows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取执行日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;