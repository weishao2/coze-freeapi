-- 修复tokens表结构，添加token_name和token_value字段
USE coze_api;

-- 检查是否已经有token_name字段，如果没有则添加
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'coze_api' 
                     AND TABLE_NAME = 'tokens' 
                     AND COLUMN_NAME = 'token_name');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE tokens ADD COLUMN token_name VARCHAR(100) NOT NULL DEFAULT "默认Token" AFTER user_id',
              'SELECT "token_name column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查是否已经有token_value字段，如果没有则重命名token字段
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'coze_api' 
                     AND TABLE_NAME = 'tokens' 
                     AND COLUMN_NAME = 'token_value');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE tokens CHANGE COLUMN token token_value VARCHAR(500) NOT NULL',
              'SELECT "token_value column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查是否已经有updated_at字段，如果没有则添加
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'coze_api' 
                     AND TABLE_NAME = 'tokens' 
                     AND COLUMN_NAME = 'updated_at');

SET @sql = IF(@column_exists = 0, 
              'ALTER TABLE tokens ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间" AFTER created_at',
              'SELECT "updated_at column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新现有数据，为token_name设置默认值
UPDATE tokens SET token_name = CONCAT('Token-', id) WHERE token_name = '默认Token';