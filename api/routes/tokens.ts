import { Router, Request, Response } from 'express';
import pool, { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 获取用户的所有 Token
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const rows = await executeQuery(
      'SELECT id, token_name, token_value, description, is_active, created_at FROM tokens WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取 Token 列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 添加新的 Token
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { token_name, token_value, description, is_active = true } = req.body;
    const userId = req.user?.id;



    if (!token_name || !token_value) {
      return res.status(400).json({
        success: false,
        message: 'Token名称和Token值不能为空'
      });
    }

    // 检查 Token 是否已存在
    const existingTokens = await executeQuery(
      'SELECT id FROM tokens WHERE (token_value = ? OR token_name = ?) AND user_id = ?',
      [token_value, token_name, userId]
    );

    if (existingTokens.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Token名称或Token值已存在'
      });
    }

    // 添加 Token
    const result = await executeQuery(
      'INSERT INTO tokens (user_id, token_name, token_value, description, is_active) VALUES (?, ?, ?, ?, ?)',
      [userId, token_name, token_value, description || '', is_active]
    );

    console.log('Token插入结果:', result);

    res.status(201).json({
      success: true,
      message: 'Token 添加成功',
      data: {
        id: result.insertId,
        token_name,
        token_value,
        description: description || '',
        is_active
      }
    });
  } catch (error) {
    console.error('添加 Token 错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新 Token
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tokenId = req.params.id;
    const { token_name, token_value, description, is_active } = req.body;
    const userId = req.user?.id;

    console.log('更新Token数据:', { tokenId, token_name, token_value: token_value ? '***' : undefined, description, is_active });

    // 检查 Token 是否属于当前用户
    const existingTokens = await executeQuery(
      'SELECT id FROM tokens WHERE id = ? AND user_id = ?',
      [tokenId, userId]
    );

    if (existingTokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Token 不存在或无权限访问'
      });
    }

    // 如果提供了新的 token_value，检查是否与其他 token 冲突
    if (token_value) {
      const conflictTokens = await executeQuery(
        'SELECT id FROM tokens WHERE token_value = ? AND user_id = ? AND id != ?',
        [token_value, userId, tokenId]
      );

      if (conflictTokens.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Token值已存在'
        });
      }
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];
    
    if (token_name !== undefined) {
      updateFields.push('token_name = ?');
      updateValues.push(token_name);
    }
    if (token_value !== undefined) {
      updateFields.push('token_value = ?');
      updateValues.push(token_value);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
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
    updateValues.push(tokenId, userId);

    // 更新 Token
    const result = await executeQuery(
      `UPDATE tokens SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Token 更新成功'
    });
  } catch (error) {
    console.error('更新 Token 错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除 Token
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tokenId = req.params.id;
    const userId = req.user?.id;

    // 检查 Token 是否属于当前用户
    const existingTokens = await executeQuery(
      'SELECT id FROM tokens WHERE id = ? AND user_id = ?',
      [tokenId, userId]
    );

    if (existingTokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Token 不存在或无权限访问'
      });
    }

    // 删除 Token
    await executeQuery(
      'DELETE FROM tokens WHERE id = ? AND user_id = ?',
      [tokenId, userId]
    );

    res.json({
      success: true,
      message: 'Token 删除成功'
    });
  } catch (error) {
    console.error('删除 Token 错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;