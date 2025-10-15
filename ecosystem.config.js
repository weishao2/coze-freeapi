module.exports = {
  apps: [
    {
      name: 'coze-freeapi',
      script: './dist/api/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/coze-freeapi.git',
      path: '/www/wwwroot/coze-freeapi',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:backend && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};