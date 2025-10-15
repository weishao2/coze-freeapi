# Coze API 转换服务 - 宝塔面板部署指南

## 前置要求

### 服务器要求
- **操作系统**: CentOS 7+ / Ubuntu 18+ / Debian 9+
- **内存**: 最低 2GB，推荐 4GB+
- **存储**: 最低 20GB 可用空间
- **网络**: 公网 IP，开放 80/443 端口

### 宝塔面板要求
- **宝塔版本**: 7.7.0+
- **必需软件**: Nginx 1.20+, MySQL 5.7+, Node.js 20+, PM2管理器

## 详细部署步骤

### 第一步：准备服务器环境

1. **安装宝塔面板**
   ```bash
   # CentOS
   yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh
   
   # Ubuntu/Debian
   wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
   ```

2. **安装必需软件**
   - 登录宝塔面板
   - 进入 "软件商店"
   - 安装以下软件：
     - **Nginx** (1.20+)
     - **MySQL** (5.7+ 或 8.0+)
     - **Node.js版本管理器** (选择 Node.js 20+)

### 第二步：上传和解压项目文件

1. **创建网站目录**
   ```bash
   mkdir -p /www/wwwroot/coze-freeapi
   ```

2. **上传部署包**
   - 将 `coze-freeapi-deploy-*.zip` 上传到服务器
   - 解压到 `/www/wwwroot/coze-freeapi/` 目录

3. **设置目录权限**
   ```bash
   chown -R www:www /www/wwwroot/coze-freeapi
   chmod -R 755 /www/wwwroot/coze-freeapi
   ```

### 第三步：配置数据库

1. **创建数据库**
   - 进入宝塔面板 "数据库" 管理
   - 点击 "添加数据库"
   - 数据库名: `coze_freeapi`
   - 用户名: `coze_user` (或自定义)
   - 密码: 设置强密码

2. **导入数据库结构**
   - 点击数据库名称进入 phpMyAdmin
   - 选择 "导入" 选项卡
   - 上传并执行 `database/init.sql` 文件

3. **验证数据库**
   ```sql
   USE coze_freeapi;
   SHOW TABLES;
   -- 应该看到 users, tokens, workflows, logs 等表
   ```

### 第四步：配置环境变量

编辑 `/www/wwwroot/coze-freeapi/.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=coze_user
DB_PASSWORD=your_strong_password
DB_NAME=coze_freeapi

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here

# Coze API 配置
COZE_API_BASE_URL=https://api.coze.cn/v1

# 服务配置
PORT=3000
NODE_ENV=production
```

**重要提示**:
- 将 `your_strong_password` 替换为实际数据库密码
- 将 `your_jwt_secret_key_here` 替换为随机生成的密钥
- 确保 JWT_SECRET 足够复杂（建议 32+ 字符）

### 第五步：安装项目依赖

1. **进入项目目录**
   ```bash
   cd /www/wwwroot/coze-freeapi
   ```

2. **安装生产依赖**
   ```bash
   npm install --production --omit=dev
   ```

3. **验证安装**
   ```bash
   ls node_modules/  # 确认依赖已安装
   ```

### 第六步：配置 Node.js 项目

1. **进入宝塔面板 "网站" -> "Node项目"**

2. **添加项目配置**
   - **项目名称**: `coze-freeapi`
   - **添加方式**: 自定义
   - **启动文件**: `/www/wwwroot/coze-freeapi/dist/api/app.js`
   - **运行目录**: `/www/wwwroot/coze-freeapi`
   - **Node版本**: 20+ (选择已安装的版本)
   - **实例数量**: 1 (可根据服务器配置调整)
   - **内存限制**: 512MB (可根据需要调整)
   - **勾选**: "不安装node_module" (因为已手动安装)

3. **启动项目**
   - 点击 "启动" 按钮
   - 查看日志确认启动成功

### 第七步：配置 Nginx 反向代理

1. **添加网站**
   - 进入 "网站" 管理
   - 点击 "添加站点"
   - 域名: 你的域名 (如 `api.yourdomain.com`)
   - 根目录: `/www/wwwroot/coze-freeapi/dist`

2. **配置反向代理**
   - 点击网站设置 -> "反向代理"
   - 添加反向代理:
     - **代理名称**: coze-api
     - **目标URL**: `http://127.0.0.1:3000`
     - **发送域名**: `$host`

3. **自定义 Nginx 配置** (可选)
   如需更详细的配置，可参考项目中的 `nginx.conf` 文件

### 第八步：配置 SSL 证书 (推荐)

1. **申请 SSL 证书**
   - 进入网站设置 -> "SSL"
   - 选择 "Let's Encrypt" 免费证书
   - 或上传自有证书

2. **强制 HTTPS**
   - 开启 "强制HTTPS" 选项

### 第九步：验证部署

1. **检查服务状态**
   ```bash
   # 检查 Node.js 进程
   ps aux | grep node
   
   # 检查端口监听
   netstat -tlnp | grep 3000
   ```

2. **访问测试**
   - 浏览器访问: `https://yourdomain.com`
   - 应该看到 Coze API 转换服务的管理界面

3. **API 测试**
   ```bash
   # 测试健康检查接口
   curl https://yourdomain.com/api/health
   ```

## 维护和监控

### 日常维护命令

```bash
# 查看应用日志
pm2 logs coze-freeapi

# 重启应用
pm2 restart coze-freeapi

# 查看应用状态
pm2 status

# 查看系统资源
pm2 monit
```

### 备份策略

1. **数据库备份**
   ```bash
   # 每日自动备份
   mysqldump -u coze_user -p coze_freeapi > backup_$(date +%Y%m%d).sql
   ```

2. **文件备份**
   ```bash
   # 备份配置文件
   tar -czf config_backup_$(date +%Y%m%d).tar.gz .env ecosystem.config.js
   ```

### 性能优化

1. **启用 Gzip 压缩**
   - 在 Nginx 配置中启用 gzip

2. **配置缓存**
   - 为静态资源设置适当的缓存头

3. **监控资源使用**
   - 定期检查 CPU、内存使用情况
   - 根据负载调整 PM2 实例数量

## 故障排除

### 常见问题

1. **应用无法启动**
   ```bash
   # 检查日志
   pm2 logs coze-freeapi
   
   # 检查配置文件
   node -c dist/api/app.js
   ```

2. **数据库连接失败**
   - 检查 `.env` 文件中的数据库配置
   - 确认数据库服务正在运行
   - 验证用户权限

3. **端口冲突**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep 3000
   
   # 修改端口配置
   vim .env  # 修改 PORT 变量
   ```

4. **权限问题**
   ```bash
   # 重新设置权限
   chown -R www:www /www/wwwroot/coze-freeapi
   chmod -R 755 /www/wwwroot/coze-freeapi
   ```

### 联系支持

如遇到部署问题，请提供以下信息：
- 服务器系统版本
- 宝塔面板版本
- 错误日志内容
- 配置文件内容（隐藏敏感信息）

---

**部署完成后，请及时修改默认密码和配置，确保系统安全！**