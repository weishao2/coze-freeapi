import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || '47.93.52.165',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Weishao1234',
  database: process.env.DB_NAME || 'coze_api',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  // 增加连接稳定性配置
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
  // 处理连接断开
  handleDisconnects: true,
  // 重连配置
  reconnectDelay: 2000,
  maxReconnects: 3
};

// 创建连接池
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  charset: dbConfig.charset,
  timezone: dbConfig.timezone,
  waitForConnections: true,
  connectionLimit: 5, // 减少连接数避免过载
  queueLimit: 0,
  // 增加连接池稳定性配置
  idleTimeout: 60000
  // 移除不存在的 acquireTimeout 和 reconnect 属性
});

// 测试数据库连接
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
};

// 增强的数据库执行函数，带重试机制
export const executeQuery = async (query: string, params: any[] = [], retries = 3): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const [rows, fields] = await pool.execute(query, params);
      // 只返回数据行，不返回字段信息
      return rows;
    } catch (error: any) {
      console.error(`数据库查询失败 (尝试 ${attempt}/${retries}):`, error);
      
      // 如果是连接错误且还有重试次数，等待后重试
      if ((error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') && attempt < retries) {
        console.log(`等待 ${attempt * 1000}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      
      // 最后一次尝试失败或非连接错误，抛出异常
      throw error;
    }
  }
};

export default pool;