#!/bin/bash
# Git自动部署监控脚本
# 文件：/www/wwwroot/coze-freeapi/git-monitor.sh

cd /www/wwwroot/coze-freeapi

# 检查远程更新
git fetch origin main 2>/dev/null

# 比较本地和远程
LOCAL=$(git rev-parse HEAD 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): 发现代码更新，开始部署..." >> /www/wwwroot/coze-freeapi/auto-deploy.log
    
    # 拉取最新代码
    git pull origin main >> /www/wwwroot/coze-freeapi/auto-deploy.log 2>&1
    
    # 执行部署脚本
    /www/wwwroot/coze-freeapi/bt-auto-deploy.sh >> /www/wwwroot/coze-freeapi/auto-deploy.log 2>&1
    
    echo "$(date): 自动部署完成" >> /www/wwwroot/coze-freeapi/auto-deploy.log
else
    echo "$(date): 代码无更新" >> /www/wwwroot/coze-freeapi/git-check.log
fi