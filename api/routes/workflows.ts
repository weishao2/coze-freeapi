import { Router, Request, Response } from 'express';
import pool, { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 获取用户的所有工作流配置
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const rows = await executeQuery(
      'SELECT id, workflow_id, workflow_name, parameters, method, output_format, token, is_async, created_at, updated_at, description, default_params, is_active FROM workflows WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取工作流列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取单个工作流配置
router.get('/:workflow_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflow_id;
    const userId = req.user?.id;

    const workflows = await executeQuery(
      'SELECT * FROM workflows WHERE workflow_id = ? AND user_id = ?',
      [workflowId, userId]
    );
    if (workflows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工作流配置不存在'
      });
    }

    res.json({
      success: true,
      data: workflows[0]
    });
  } catch (error) {
    console.error('获取工作流详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 创建新的工作流配置
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { workflow_id, workflow_name, description, default_params, parameters, method = 'POST', output_format = null, token, is_async = false, is_active = true } = req.body;
    const userId = req.user?.id;

    if (!workflow_id || !workflow_name || !token) {
      return res.status(400).json({
        success: false,
        message: '工作流ID、名称和Token不能为空'
      });
    }

    // 验证 Token 是否属于当前用户
    const tokenRows = await executeQuery(
      'SELECT id FROM tokens WHERE token_value = ? AND user_id = ? AND is_active = true',
      [token, userId]
    );

    if (tokenRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: '无效的Token或Token不属于当前用户'
      });
    }

    // 检查工作流ID是否已存在
    const existingWorkflows = await executeQuery(
      'SELECT id FROM workflows WHERE workflow_id = ? AND user_id = ?',
      [workflow_id, userId]
    );

    if (existingWorkflows.length > 0) {
      return res.status(409).json({
        success: false,
        message: '工作流ID已存在'
      });
    }

    // 创建工作流配置
    const result = await executeQuery(
      'INSERT INTO workflows (user_id, workflow_id, workflow_name, description, default_params, parameters, method, output_format, token, is_async, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, workflow_id, workflow_name, description || null, default_params ? JSON.stringify(default_params) : null, parameters ? JSON.stringify(parameters) : null, method || null, output_format, token, is_async, is_active]
    );

    res.status(201).json({
      success: true,
      message: '工作流配置创建成功',
      data: {
        id: result.insertId,
        workflow_id,
        workflow_name,
        description,
        default_params,
        parameters,
        method,
        output_format,
        token,
        is_async,
        is_active
      }
    });
  } catch (error) {
    console.error('创建工作流配置错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新工作流配置
router.put('/:workflow_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflow_id;
    const { workflow_name, parameters, method, output_format, token, is_async, is_active } = req.body;
    const userId = req.user?.id;

    // 检查工作流配置是否属于当前用户
    const existingWorkflows = await executeQuery(
      'SELECT id FROM workflows WHERE workflow_id = ? AND user_id = ?',
      [workflowId, userId]
    );

    if (existingWorkflows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工作流配置不存在或无权限访问'
      });
    }

    // 如果提供了新的 Token，验证其有效性
    if (token) {
      const tokenRows = await executeQuery(
        'SELECT id FROM tokens WHERE token_value = ? AND user_id = ? AND is_active = true',
        [token, userId]
      );

      if (tokenRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '无效的Token或Token不属于当前用户'
        });
      }
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];
    
    if (workflow_name !== undefined) {
      updateFields.push('workflow_name = ?');
      updateValues.push(workflow_name);
    }
    if (parameters !== undefined) {
      updateFields.push('parameters = ?');
      updateValues.push(parameters ? JSON.stringify(parameters) : null);
    }
    if (method !== undefined) {
      updateFields.push('method = ?');
      updateValues.push(method);
    }
    if (output_format !== undefined) {
      updateFields.push('output_format = ?');
      updateValues.push(output_format);
    }
    if (token !== undefined) {
      updateFields.push('token = ?');
      updateValues.push(token);
    }
    if (is_async !== undefined) {
      updateFields.push('is_async = ?');
      updateValues.push(is_async);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }

    // 添加WHERE条件的参数
    updateValues.push(workflowId, userId);

    // 更新工作流配置
    const updateResult = await executeQuery(
      `UPDATE workflows SET ${updateFields.join(', ')} WHERE workflow_id = ? AND user_id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: '工作流配置更新成功'
    });
  } catch (error) {
    console.error('更新工作流错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除工作流配置
router.delete('/:workflow_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflow_id;
    const userId = req.user?.id;

    // 检查工作流配置是否属于当前用户
    const existingWorkflows = await executeQuery(
      'SELECT id FROM workflows WHERE workflow_id = ? AND user_id = ?',
      [workflowId, userId]
    );

    if (existingWorkflows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工作流配置不存在或无权限访问'
      });
    }

    // 删除工作流配置
    await executeQuery(
      'DELETE FROM workflows WHERE workflow_id = ? AND user_id = ?',
      [workflowId, userId]
    );

    res.json({
      success: true,
      message: '工作流配置删除成功'
    });
  } catch (error) {
    console.error('删除工作流错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;