module.exports = {
  apps: [{
    name: 'backend',
    script: './server.js',
    instances: 2,  // Use 2 instances for your 2 vCPU cores
    exec_mode: 'cluster',  // CRITICAL: Enables load balancing
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',  // Restart if memory exceeds 500MB
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/root/.pm2/logs/backend-error.log',
    out_file: '/root/.pm2/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    min_uptime: '10s',  // Min uptime before considering app stable
    max_restarts: 10,  // Max restarts within 1 minute
    // Health check
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
