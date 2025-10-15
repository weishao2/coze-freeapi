const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class AutoDeploy {
  constructor() {
    this.isBuilding = false;
    this.buildQueue = false;
    this.debounceTimer = null;
    this.debounceDelay = 2000; // 2秒防抖
  }

  log(message) {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] ${message}`);
  }

  async executeCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      this.log(`执行命令: ${command}`);
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          this.log(`命令执行失败: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          this.log(`警告: ${stderr}`);
        }
        if (stdout) {
          this.log(`输出: ${stdout}`);
        }
        resolve(stdout);
      });
    });
  }

  async build() {
    if (this.isBuilding) {
      this.buildQueue = true;
      this.log('构建正在进行中，已加入队列...');
      return;
    }

    this.isBuilding = true;
    this.buildQueue = false;

    try {
      this.log('开始自动构建...');
      
      // 1. 构建前端
      await this.executeCommand('npm run build');
      this.log('前端构建完成');

      // 2. 重启后端服务
      try {
        await this.executeCommand('npx pm2 restart coze-api');
        this.log('后端服务重启完成');
      } catch (error) {
        this.log('PM2重启失败，尝试启动服务...');
        await this.executeCommand('npx pm2 start ecosystem.config.js');
      }

      this.log('✅ 自动部署完成！');
      
    } catch (error) {
      this.log(`❌ 部署失败: ${error.message}`);
    } finally {
      this.isBuilding = false;
      
      // 如果队列中有新的构建请求，继续执行
      if (this.buildQueue) {
        setTimeout(() => this.build(), 1000);
      }
    }
  }

  debouncedBuild() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.build();
    }, this.debounceDelay);
  }

  start() {
    this.log('🚀 启动自动部署监听...');
    
    // 监听前端源码变化
    const frontendWatcher = chokidar.watch([
      'src/**/*',
      'public/**/*',
      'index.html',
      'vite.config.ts',
      'package.json'
    ], {
      ignored: [
        'node_modules/**',
        'dist/**',
        '.git/**',
        '**/*.log'
      ],
      persistent: true,
      ignoreInitial: true
    });

    // 监听后端代码变化
    const backendWatcher = chokidar.watch([
      'api/**/*',
      'ecosystem.config.js',
      '.env'
    ], {
      ignored: [
        'node_modules/**',
        '.git/**',
        '**/*.log'
      ],
      persistent: true,
      ignoreInitial: true
    });

    frontendWatcher.on('change', (filePath) => {
      this.log(`前端文件变更: ${filePath}`);
      this.debouncedBuild();
    });

    frontendWatcher.on('add', (filePath) => {
      this.log(`前端文件新增: ${filePath}`);
      this.debouncedBuild();
    });

    backendWatcher.on('change', (filePath) => {
      this.log(`后端文件变更: ${filePath}`);
      this.debouncedBuild();
    });

    backendWatcher.on('add', (filePath) => {
      this.log(`后端文件新增: ${filePath}`);
      this.debouncedBuild();
    });

    this.log('📁 监听目录:');
    this.log('  - 前端: src/, public/, index.html, vite.config.ts');
    this.log('  - 后端: api/, ecosystem.config.js, .env');
    this.log('💡 修改任何文件后将自动触发构建和部署');
    this.log('⏱️  防抖延迟: 2秒');
    
    // 优雅退出处理
    process.on('SIGINT', () => {
      this.log('收到退出信号，正在关闭监听...');
      frontendWatcher.close();
      backendWatcher.close();
      process.exit(0);
    });
  }
}

// 启动自动部署
const autoDeploy = new AutoDeploy();
autoDeploy.start();