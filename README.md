# Coze API 转换服务

一个基于 React + Express + MySQL 的 Coze API 转换服务，提供用户友好的 Web 界面来管理和使用 Coze API。

## 🌟 功能特性

- **用户认证系统**：注册、登录、密码修改
- **Token 管理**：创建、编辑、删除 API Token
- **工作流配置**：管理 Coze Bot 工作流
- **API 转换**：GET/POST 请求格式转换
- **数据格式转换**：字符串到 JSON 的智能转换
- **执行日志**：详细的 API 调用日志和统计
- **响应式设计**：支持桌面和移动设备

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5
- React Router 6
- Axios
- Vite

### 后端
- Node.js 20 + Express 4
- MySQL 8.0
- JWT 认证
- bcryptjs 密码加密

## 📦 项目结构

```
coze-freeapi/
├── api/                    # 后端代码
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── routes/           # API 路由
│   └── app.ts            # 应用入口
├── src/                   # 前端代码
│   ├── components/       # React 组件
│   ├── pages/           # 页面组件
│   ├── services/        # API 服务
│   ├── hooks/           # 自定义 Hooks
│   ├── types/           # TypeScript 类型
│   └── router/          # 路由配置
├── database/             # 数据库脚本
├── public/              # 静态资源
└── dist/               # 构建输出
```

## 🚀 快速开始

### 环境要求

- Node.js 20+
- MySQL 8.0+
- npm 或 pnpm

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/coze-freeapi.git
cd coze-freeapi
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
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
NODE_ENV=development

# Coze API 配置
COZE_API_BASE_URL=https://api.coze.cn
COZE_API_TIMEOUT=30000
```

4. **初始化数据库**
```bash
mysql -u用户名 -p密码 -e "CREATE DATABASE coze_freeapi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u用户名 -p密码 coze_freeapi < database/init.sql
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:5173 查看前端界面
访问 http://localhost:3001 查看后端 API

## 📚 API 文档

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/change-password` - 修改密码

### Token 管理

- `GET /api/tokens` - 获取用户 Token 列表
- `POST /api/tokens` - 创建新 Token
- `PUT /api/tokens/:id` - 更新 Token
- `DELETE /api/tokens/:id` - 删除 Token

### 工作流管理

- `GET /api/workflows` - 获取工作流列表
- `GET /api/workflows/:id` - 获取单个工作流
- `POST /api/workflows` - 创建工作流
- `PUT /api/workflows/:id` - 更新工作流
- `DELETE /api/workflows/:id` - 删除工作流

### API 执行

- `GET /api/execute/:workflowId` - 执行工作流（GET 方式）
- `POST /api/execute/:workflowId` - 执行工作流（POST 方式）

### 日志管理

- `GET /api/logs` - 获取执行日志
- `GET /api/logs/:id` - 获取日志详情
- `GET /api/logs/stats` - 获取日志统计
- `DELETE /api/logs` - 删除日志

## 🏗️ 生产部署

### 宝塔面板部署

1. **准备服务器环境**
   - 安装宝塔面板
   - 安装 Node.js 20+
   - 安装 MySQL 8.0
   - 安装 PM2

2. **上传项目文件**
```bash
# 使用部署脚本
chmod +x deploy.sh
./deploy.sh
```

3. **配置数据库**
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE coze_freeapi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据库结构
mysql -u root -p coze_freeapi < database/init.sql
```

4. **配置 Nginx**
   - 在宝塔面板添加站点
   - 配置反向代理到 `http://127.0.0.1:3001`
   - 上传 SSL 证书

5. **启动服务**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Docker 部署

```bash
# 构建镜像
docker build -t coze-freeapi .

# 运行容器
docker run -d \
  --name coze-freeapi \
  -p 3001:3001 \
  -e DB_HOST=your_db_host \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  coze-freeapi
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DB_HOST` | 数据库主机 | localhost |
| `DB_PORT` | 数据库端口 | 3306 |
| `DB_USER` | 数据库用户名 | - |
| `DB_PASSWORD` | 数据库密码 | - |
| `DB_NAME` | 数据库名称 | coze_freeapi |
| `JWT_SECRET` | JWT 密钥 | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 7d |
| `PORT` | 服务端口 | 3001 |
| `NODE_ENV` | 运行环境 | development |
| `COZE_API_BASE_URL` | Coze API 基础地址 | https://api.coze.cn |
| `COZE_API_TIMEOUT` | API 超时时间 | 30000 |

### Nginx 配置

参考 `nginx.conf` 文件进行配置，主要包括：
- 静态文件服务
- API 反向代理
- HTTPS 重定向
- 安全头设置

## 📊 监控和日志

### PM2 监控
```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs coze-freeapi

# 重启服务
pm2 restart coze-freeapi

# 查看监控面板
pm2 monit
```

### 日志文件
- 应用日志：`logs/combined.log`
- 错误日志：`logs/err.log`
- 输出日志：`logs/out.log`
- Nginx 日志：`/www/wwwlogs/coze-freeapi.log`

## 🛡️ 安全建议

1. **定期更新依赖包**
```bash
npm audit
npm update
```

2. **使用强密码**
   - JWT_SECRET 使用复杂的随机字符串
   - 数据库密码使用强密码

3. **配置防火墙**
   - 只开放必要的端口（80, 443, 22）
   - 限制数据库访问

4. **启用 HTTPS**
   - 配置 SSL 证书
   - 强制 HTTPS 重定向

5. **定期备份**
   - 数据库定期备份
   - 代码版本控制

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 常见问题

### Q: 数据库连接失败？
A: 检查 `.env` 文件中的数据库配置，确保数据库服务正在运行。

### Q: JWT Token 验证失败？
A: 检查 `JWT_SECRET` 是否正确配置，确保前后端使用相同的密钥。

### Q: API 调用超时？
A: 检查 `COZE_API_TIMEOUT` 设置，根据网络情况调整超时时间。

### Q: 前端页面空白？
A: 检查浏览器控制台错误，确保后端 API 服务正常运行。

## 📞 支持

如果您遇到问题或有建议，请：
1. 查看 [常见问题](#-常见问题)
2. 搜索 [Issues](https://github.com/your-username/coze-freeapi/issues)
3. 创建新的 Issue

---

⭐ 如果这个项目对您有帮助，请给它一个星标！