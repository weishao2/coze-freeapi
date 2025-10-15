#!/bin/bash

# 宝塔面板自动部署脚本
# 适用于 Coze API 转换服务

# 配置变量
PROJECT_DIR="/www/wwwroot/coze-freeapi"
BACKUP_DIR="/www/backup/coze-freeapi"
LOG_FILE="/www/wwwroot/coze-freeapi/deploy.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 创建备份目录
mkdir -p $BACKUP_DIR

log "开始自动部署..."

# 进入项目目录
cd $PROJECT_DIR

# 备份当前版本
log "备份当前版本..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
cp -r $PROJECT_DIR $BACKUP_DIR/$BACKUP_NAME

# 拉取最新代码
log "拉取最新代码..."
git pull origin main
if [ $? -ne 0 ]; then
    log "Git拉取失败，部署终止"
    exit 1
fi

# 安装依赖
log "安装依赖..."
npm install --production
if [ $? -ne 0 ]; then
    log "依赖安装失败，部署终止"
    exit 1
fi

# 构建后端
log "构建后端..."
npm run build:backend
if [ $? -ne 0 ]; then
    log "后端构建失败，部署终止"
    exit 1
fi

# 构建前端
log "构建前端..."
npm run build
if [ $? -ne 0 ]; then
    log "前端构建失败，部署终止"
    exit 1
fi

# 重启PM2服务
log "重启PM2服务..."
pm2 restart coze-freeapi
if [ $? -ne 0 ]; then
    log "PM2重启失败，尝试启动服务..."
    pm2 start ecosystem.config.js --env production
fi

# 重载Nginx配置
log "重载Nginx配置..."
nginx -t && nginx -s reload

# 清理旧备份（保留最近5个）
log "清理旧备份..."
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -rf

log "自动部署完成！"

# 发送通知（可选）
# curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
#      -d "chat_id=<YOUR_CHAT_ID>&text=Coze API服务部署完成"