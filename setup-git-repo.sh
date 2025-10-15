#!/bin/bash
# Git仓库初始化和推送脚本
# 文件：/www/wwwroot/coze-freeapi/setup-git-repo.sh

echo "开始初始化Git仓库..."

# 进入项目目录
cd /www/wwwroot/coze-freeapi

# 初始化Git（如果还没有）
if [ ! -d ".git" ]; then
    git init
    echo "Git仓库初始化完成"
fi

# 添加远程仓库
git remote remove origin 2>/dev/null
git remote add origin http://weishao:Weishao@115.190.0.171:10082/weishao/coze-freeapi.git

echo "远程仓库配置完成"

# 添加所有文件
git add .

# 提交
git commit -m "初始提交：Coze API转换服务 - $(date)"

# 推送到Gitea
git push -u origin main

echo "代码推送完成！"
echo "现在可以在 http://115.190.0.171:10082/weishao/coze-freeapi 查看你的仓库"