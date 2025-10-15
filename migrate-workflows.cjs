const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: '47.93.52.165',
    user: 'root',
    password: 'Weishao1234',
    database: 'coze_api'
  });

  const statements = [
    'ALTER TABLE workflows ADD COLUMN description TEXT COMMENT "工作流描述" AFTER workflow_name',
    'ALTER TABLE workflows ADD COLUMN default_params TEXT COMMENT "默认参数JSON格式" AFTER description',
    'ALTER TABLE workflows ADD COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT "是否激活" AFTER is_async'
  ];

  for (const stmt of statements) {
    try {
      await connection.execute(stmt);
      console.log('Executed:', stmt.substring(0, 50) + '...');
    } catch (err) {
      console.log('Error or already exists:', err.message);
    }
  }

  console.log('Workflows migration completed');
  await connection.end();
})();