-- 修复workflows表结构，添加缺失的字段
USE coze_api;

-- 添加description字段
ALTER TABLE workflows ADD COLUMN description TEXT COMMENT '工作流描述' AFTER workflow_name;

-- 添加default_params字段
ALTER TABLE workflows ADD COLUMN default_params TEXT COMMENT '默认参数(JSON格式)' AFTER description;

-- 添加is_active字段
ALTER TABLE workflows ADD COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活' AFTER is_async;