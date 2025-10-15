const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '47.93.52.165',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Weishao1234',
    database: process.env.DB_NAME || 'coze_api'
  });

  try {
    console.log('检查 tokens 表结构:');
    const [tokensSchema] = await connection.execute('DESCRIBE tokens');
    console.table(tokensSchema);

    console.log('\n检查 workflows 表结构:');
    const [workflowsSchema] = await connection.execute('DESCRIBE workflows');
    console.table(workflowsSchema);

    console.log('\n检查 workflow_logs 表结构:');
    const [logsSchema] = await connection.execute('DESCRIBE workflow_logs');
    console.table(logsSchema);

    console.log('\n检查 tokens 表数据:');
    const [tokensData] = await connection.execute('SELECT * FROM tokens LIMIT 5');
    console.table(tokensData);

  } catch (error) {
    console.error('数据库检查失败:', error);
  } finally {
    await connection.end();
  }
}

checkDatabaseSchema();