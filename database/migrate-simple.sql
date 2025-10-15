-- 修复tokens表结构，添加token_name和token_value字段
USE coze_api;

-- 添加token_name字段
ALTER TABLE tokens ADD COLUMN token_name VARCHAR(100) NOT NULL DEFAULT '默认Token' AFTER user_id;

-- 重命名token字段为token_value
ALTER TABLE tokens CHANGE COLUMN token token_value VARCHAR(500) NOT NULL;

-- 添加updated_at字段
ALTER TABLE tokens ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER created_at;

-- 更新现有数据，为token_name设置默认值
UPDATE tokens SET token_name = CONCAT('Token-', id) WHERE token_name = '默认Token';