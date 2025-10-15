# GitHub 自动部署配置指南

## 🚀 第一步：在GitHub上创建仓库

1. **登录GitHub**
   - 访问 https://github.com
   - 登录你的GitHub账户

2. **创建新仓库**
   - 点击右上角 "+" → "New repository"
   - Repository name: `coze-freeapi`
   - Description: `Coze API 转换服务`
   - 选择 "Private"（推荐）或 "Public"
   - 勾选 "Add a README file"
   - 点击 "Create repository"

## 📤 第二步：推送代码到GitHub

在你的本地项目目录执行以下命令：

```bash
# 初始化Git（如果还没有）
git init

# 添加GitHub远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/coze-freeapi.git

# 添加所有文件
git add .

# 提交
git commit -m "初始提交：Coze API转换服务"

# 推送到GitHub
git push -u origin main
```

## 🔗 第三步：配置GitHub Webhook

1. **进入仓库设置**
   - 在你的GitHub仓库页面，点击 "Settings"
   - 在左侧菜单中点击 "Webhooks"

2. **添加Webhook**
   - 点击 "Add webhook"
   - 配置如下：
     ```
     Payload URL: http://115.190.0.171:8080/webhook-deploy.php
     Content type: application/json
     Secret: coze_api_deploy_2024
     Which events: Just the push event
     Active: 勾选
     ```
   - 点击 "Add webhook"

## 🛠️ 第四步：服务器配置

1. **上传文件到服务器**
   将以下文件上传到 `/www/wwwroot/coze-freeapi/`：
   - `webhook-deploy.php`
   - `bt-auto-deploy.sh`

2. **设置权限**
   ```bash
   chmod +x /www/wwwroot/coze-freeapi/bt-auto-deploy.sh
   chmod 644 /www/wwwroot/coze-freeapi/webhook-deploy.php
   ```

3. **配置网站**
   - 宝塔面板 → 网站 → 添加站点
   - 域名：`115.190.0.171:8080`
   - 根目录：`/www/wwwroot/coze-freeapi`
   - PHP版本：7.4+

## 🧪 第五步：测试自动部署

1. **修改代码测试**
   ```bash
   echo "# 测试GitHub自动部署 - $(date)" >> README.md
   git add README.md
   git commit -m "测试自动部署功能"
   git push origin main
   ```

2. **查看部署日志**
   ```bash
   tail -f /www/wwwroot/coze-freeapi/webhook.log
   tail -f /www/wwwroot/coze-freeapi/deploy.log
   ```

## 📊 工作流程

```
修改代码 → git push → GitHub接收 → 触发Webhook → 
服务器接收 → 执行部署脚本 → 自动构建 → 重启服务 → 部署完成
```

## 🔧 故障排除

1. **Webhook失败**
   - 检查服务器防火墙是否开放8080端口
   - 检查webhook.log日志文件

2. **部署失败**
   - 检查deploy.log日志文件
   - 确认文件权限正确

3. **服务重启失败**
   - 检查PM2状态：`pm2 status`
   - 查看PM2日志：`pm2 logs coze-api`