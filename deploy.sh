#!/bin/bash

# Coze API 转换服务部署脚本
# 适用于宝塔面板环境

set -e

echo "🚀 开始部署 Coze API 转换服务..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 用户运行此脚本"
    exit 1
fi

# 项目配置
PROJECT_NAME="coze-freeapi"
PROJECT_PATH="/www/wwwroot/$PROJECT_NAME"
BACKUP_PATH="/www/backup/$PROJECT_NAME"
NODE_VERSION="20"

echo "📁 项目路径: $PROJECT_PATH"

# 创建备份目录
mkdir -p $BACKUP_PATH

# 备份当前版本（如果存在）
if [ -d "$PROJECT_PATH" ]; then
    echo "📦 备份当前版本..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    cp -r $PROJECT_PATH $BACKUP_PATH/$BACKUP_NAME
    echo "✅ 备份完成: $BACKUP_PATH/$BACKUP_NAME"
fi

# 创建项目目录
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH

# 检查 Node.js 版本
echo "🔍 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先在宝塔面板安装 Node.js $NODE_VERSION"
    exit 1
fi

NODE_CURRENT_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_CURRENT_VERSION" -lt "$NODE_VERSION" ]; then
    echo "❌ Node.js 版本过低，当前版本: $(node -v)，需要版本: v$NODE_VERSION+"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查 PM2
echo "🔍 检查 PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

echo "✅ PM2 版本: $(pm2 -v)"

# 克隆或更新代码
if [ ! -d ".git" ]; then
    echo "📥 克隆项目代码..."
    # 这里需要替换为实际的 Git 仓库地址
    # git clone https://github.com/your-username/coze-freeapi.git .
    echo "⚠️  请手动上传项目文件到 $PROJECT_PATH"
    echo "   或者配置 Git 仓库地址并取消注释上面的 git clone 命令"
else
    echo "🔄 更新项目代码..."
    git pull origin main
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install --production

# 构建项目
echo "🔨 构建项目..."
npm run build:backend

# 创建必要的目录
mkdir -p logs
mkdir -p uploads

# 设置文件权限
chown -R www:www $PROJECT_PATH
chmod -R 755 $PROJECT_PATH

# 配置环境变量
if [ ! -f ".env" ]; then
    echo "⚙️  创建环境配置文件..."
    cat > .env << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=coze_freeapi

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 服务配置
PORT=3001
NODE_ENV=production

# Coze API 配置
COZE_API_BASE_URL=https://api.coze.cn
COZE_API_TIMEOUT=30000

# 日志配置
LOG_LEVEL=info
LOG_MAX_FILES=30
LOG_MAX_SIZE=10m
EOF
    echo "⚠️  请编辑 .env 文件配置正确的数据库和其他参数"
fi

# 停止旧的 PM2 进程
echo "🛑 停止旧的服务进程..."
pm2 stop $PROJECT_NAME 2>/dev/null || true
pm2 delete $PROJECT_NAME 2>/dev/null || true

# 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save
pm2 startup

# 检查服务状态
sleep 3
if pm2 list | grep -q "$PROJECT_NAME.*online"; then
    echo "✅ 服务启动成功！"
    pm2 list
else
    echo "❌ 服务启动失败，请检查日志："
    pm2 logs $PROJECT_NAME --lines 20
    exit 1
fi

# 显示部署信息
echo ""
echo "🎉 部署完成！"
echo "📍 项目路径: $PROJECT_PATH"
echo "🌐 API 地址: http://localhost:3001"
echo "📊 服务状态: pm2 list"
echo "📝 查看日志: pm2 logs $PROJECT_NAME"
echo "🔄 重启服务: pm2 restart $PROJECT_NAME"
echo ""
echo "⚠️  下一步操作："
echo "1. 配置 .env 文件中的数据库连接信息"
echo "2. 导入数据库结构: mysql -u用户名 -p密码 数据库名 < database/init.sql"
echo "3. 在宝塔面板配置 Nginx 反向代理"
echo "4. 配置 SSL 证书"
echo "5. 测试 API 接口是否正常工作"