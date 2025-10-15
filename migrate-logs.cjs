const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'coze_api',
      multipleStatements: true
    });

    console.log('Connected to database');

    // 读取并执行迁移脚本
    const migrationPath = path.join(__dirname, 'database', 'migrate-logs.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await connection.execute(migrationSQL);
    console.log('Logs migration completed');

  } catch (error) {
    console.error('Error or already exists:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();