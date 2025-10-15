import { Router, Request, Response } from 'express';
import pool, { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 获取用户的所有执行日志
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status, workflow_id, start_date, end_date } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    // 构建查询条件
    let whereClause = 'WHERE l.user_id = ?';
    const queryParams: any[] = [userId];

    if (status) {
      whereClause += ' AND l.status = ?';
      queryParams.push(status);
    }

    if (workflow_id) {
      whereClause += ' AND l.workflow_id = ?';
      queryParams.push(workflow_id);
    }

    if (start_date) {
      whereClause += ' AND l.created_at >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND l.created_at <= ?';
      queryParams.push(end_date);
    }

    // 获取日志列表
    const logRows = await executeQuery(
      `SELECT l.*, w.workflow_name 
       FROM workflow_logs l 
       LEFT JOIN workflows w ON l.workflow_id = w.workflow_id AND l.user_id = w.user_id 
       ${whereClause} 
       ORDER BY l.created_at DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      queryParams
    );

    // 获取总数
    const countRows = await executeQuery(
      `SELECT COUNT(*) as total FROM workflow_logs l ${whereClause}`,
      queryParams
    );

    const total = countRows[0].total;

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
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取单个日志详情
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const logId = req.params.id;
    const userId = req.user?.id;

    const logResult = await executeQuery(
      `SELECT l.*, w.workflow_name 
       FROM workflow_logs l 
       LEFT JOIN workflows w ON l.workflow_id = w.workflow_id AND l.user_id = w.user_id 
       WHERE l.id = ? AND l.user_id = ?`,
      [logId, userId]
    );

    const logs = Array.isArray(logResult) ? logResult : logResult[0];
    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日志不存在或无权限访问'
      });
    }

    const log = logs[0];
    
    // 解析 JSON 字段
    try {
      if (log.request_params) {
        log.request_params = JSON.parse(log.request_params);
      }
      if (log.response_data) {
        log.response_data = JSON.parse(log.response_data);
      }
    } catch (parseError) {
      console.warn('解析日志 JSON 字段失败:', parseError);
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('获取日志详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取日志统计信息
router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { days = 7 } = req.query;

    // 获取指定天数内的统计信息
    const statsResult = await executeQuery(
      `SELECT 
         COUNT(*) as total_calls,
         COUNT(CASE WHEN status = 'success' THEN 1 END) as success_calls,
         COUNT(CASE WHEN status = 'error' THEN 1 END) as error_calls,
         COUNT(CASE WHEN status = 'timeout' THEN 1 END) as timeout_calls,
         AVG(execution_time) as avg_execution_time,
         MAX(execution_time) as max_execution_time,
         MIN(execution_time) as min_execution_time
       FROM workflow_logs 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [userId, Number(days)]
    );
    const statsRows = Array.isArray(statsResult) ? statsResult : statsResult[0];

    // 获取每日调用统计
    const dailyStatsResult = await executeQuery(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as total_calls,
         COUNT(CASE WHEN status = 'success' THEN 1 END) as success_calls,
         COUNT(CASE WHEN status = 'error' THEN 1 END) as error_calls,
         AVG(execution_time) as avg_execution_time
       FROM workflow_logs 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId, Number(days)]
    );
    const dailyStatsRows = Array.isArray(dailyStatsResult) ? dailyStatsResult : dailyStatsResult[0];

    // 获取工作流调用排行
    const workflowStatsResult = await executeQuery(
      `SELECT 
         l.workflow_id,
         w.workflow_name,
         COUNT(*) as total_calls,
         COUNT(CASE WHEN l.status = 'success' THEN 1 END) as success_calls,
         AVG(l.execution_time) as avg_execution_time
       FROM workflow_logs l
       LEFT JOIN workflows w ON l.workflow_id = w.workflow_id AND l.user_id = w.user_id
       WHERE l.user_id = ? AND l.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY l.workflow_id
       ORDER BY total_calls DESC
       LIMIT 10`,
      [userId, Number(days)]
    );
    const workflowStatsRows = Array.isArray(workflowStatsResult) ? workflowStatsResult : workflowStatsResult[0];

    const stats = statsRows[0];
    
    res.json({
      success: true,
      data: {
        summary: {
          total_calls: stats.total_calls || 0,
          success_calls: stats.success_calls || 0,
          error_calls: stats.error_calls || 0,
          timeout_calls: stats.timeout_calls || 0,
          success_rate: stats.total_calls > 0 ? ((stats.success_calls || 0) / stats.total_calls * 100).toFixed(2) : '0.00',
          avg_execution_time: Math.round(stats.avg_execution_time || 0),
          max_execution_time: stats.max_execution_time || 0,
          min_execution_time: stats.min_execution_time || 0
        },
        daily_stats: dailyStatsRows,
        workflow_stats: workflowStatsRows
      }
    });
  } catch (error) {
    console.error('获取日志统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除日志（批量删除）
router.delete('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ids, days } = req.body;
    const userId = req.user?.id;

    if (ids && Array.isArray(ids)) {
      // 删除指定的日志
      const placeholders = ids.map(() => '?').join(',');
      await executeQuery(
        `DELETE FROM workflow_logs WHERE id IN (${placeholders}) AND user_id = ?`,
        [...ids, userId]
      );
      
      res.json({
        success: true,
        message: `成功删除 ${ids.length} 条日志`
      });
    } else if (days) {
      // 删除指定天数前的日志
      const deleteQueryResult = await executeQuery(
        'DELETE FROM workflow_logs WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [userId, Number(days)]
      );
      
      const deleteResult = Array.isArray(deleteQueryResult) ? deleteQueryResult[0] : deleteQueryResult;
      res.json({
        success: true,
        message: `成功删除 ${deleteResult.affectedRows} 条日志`
      });
    } else {
      res.status(400).json({
        success: false,
        message: '请提供要删除的日志ID或天数'
      });
    }
  } catch (error) {
    console.error('清理日志错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;