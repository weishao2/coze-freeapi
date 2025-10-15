-- Coze API 转换服务数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS coze_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coze_api;

-- 创建用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建索引
CREATE INDEX idx_users_username ON users(username);

-- 创建 Token 表
CREATE TABLE tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    token_name VARCHAR(100) NOT NULL COMMENT 'Token名称',
    token_value VARCHAR(500) NOT NULL COMMENT 'Coze API Token',
    description VARCHAR(200) COMMENT 'Token描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token表';

-- 创建索引
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_is_active ON tokens(is_active);

-- 创建工作流配置表
CREATE TABLE workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    workflow_id VARCHAR(100) NOT NULL COMMENT 'Coze工作流ID',
    workflow_name VARCHAR(200) NOT NULL COMMENT '工作流名称',
    parameters TEXT COMMENT '输入参数配置(JSON格式)',
    method ENUM('GET', 'POST') DEFAULT 'POST' COMMENT '请求方式',
    output_format TEXT COMMENT '输出格式配置',
    token VARCHAR(500) NOT NULL COMMENT '使用的Token',
    is_async BOOLEAN DEFAULT FALSE COMMENT '是否异步',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流配置表';

-- 创建索引
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_workflow_id ON workflows(workflow_id);

-- 创建工作流运行日志表
CREATE TABLE workflow_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    workflow_id VARCHAR(100) NOT NULL COMMENT '工作流ID',
    request_params TEXT COMMENT '请求参数',
    response_data TEXT COMMENT '响应数据',
    is_async BOOLEAN DEFAULT FALSE COMMENT '是否异步',
    execution_time INT DEFAULT 0 COMMENT '执行时间(毫秒)',
    status ENUM('success', 'error', 'timeout') DEFAULT 'success' COMMENT '执行状态',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流运行日志表';

-- 创建索引
CREATE INDEX idx_workflow_logs_user_id ON workflow_logs(user_id);
CREATE INDEX idx_workflow_logs_workflow_id ON workflow_logs(workflow_id);
CREATE INDEX idx_workflow_logs_created_at ON workflow_logs(created_at DESC);

-- 创建定时清理 7 天前日志的事件
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_old_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM workflow_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
END$$
DELIMITER ;

-- 启用事件调度器
SET GLOBAL event_scheduler = ON;

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO users (username, password_hash) VALUES 
('admin', '$2b$10$rQZ9QmjQQm9QmjQQm9QmjOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK');

-- 插入示例 Token
INSERT INTO tokens (user_id, token_name, token_value, description) VALUES 
(1, '示例Token', 'pat_example_token_here', '示例 Coze API Token');

-- 插入示例工作流配置
INSERT INTO workflows (user_id, workflow_id, workflow_name, parameters, method, token) VALUES 
(1, '73664689170551*****', '示例工作流', '{"user_id": "12345", "user_name": "George"}', 'POST', 'pat_example_token_here');