const mysql = require('mysql2/promise');

async function checkTable() {
  let connection;
  
  try {
    // 创建数据库连接 - 使用与应用相同的配置
    connection = await mysql.createConnection({
      host: '47.93.52.165',
      port: 3306,
      user: 'root',
      password: 'Weishao1234',
      database: 'coze_api'
    });

    console.log('Connected to database');

    // 检查表结构
    const [rows] = await connection.execute('DESCRIBE workflow_logs');
    console.log('workflow_logs table structure:');
    console.table(rows);

    // 手动添加缺失的列
    try {
      await connection.execute(`
        ALTER TABLE workflow_logs 
        ADD COLUMN request_method ENUM('GET', 'POST') DEFAULT 'POST'
      `);
      console.log('Added request_method column');
    } catch (error) {
      console.log('request_method column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE workflow_logs 
        ADD COLUMN workflow_name VARCHAR(200)
      `);
      console.log('Added workflow_name column');
    } catch (error) {
      console.log('workflow_name column already exists or error:', error.message);
    }

    // 再次检查表结构
    const [newRows] = await connection.execute('DESCRIBE workflow_logs');
    console.log('Updated workflow_logs table structure:');
    console.table(newRows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTable();