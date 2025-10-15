-- 修复workflow_logs表结构，添加request_method字段
USE coze_api;

-- 检查是否已经有request_method字段，如果没有则添加
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'coze_api' 
                     AND TABLE_NAME = 'workflow_logs' 
                     AND COLUMN_NAME = 'request_method');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE workflow_logs ADD COLUMN request_method ENUM(''GET'', ''POST'') DEFAULT ''POST'' COMMENT ''请求方法'' AFTER workflow_id',
              'SELECT "request_method column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查是否已经有workflow_name字段，如果没有则添加
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'coze_api' 
                     AND TABLE_NAME = 'workflow_logs' 
                     AND COLUMN_NAME = 'workflow_name');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE workflow_logs ADD COLUMN workflow_name VARCHAR(200) COMMENT ''工作流名称'' AFTER request_method',
              'SELECT "workflow_name column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;