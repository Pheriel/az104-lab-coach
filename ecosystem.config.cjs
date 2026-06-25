module.exports = {
  apps: [
    {
      name: 'az104-lab-coach',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        HOST: process.env.HOST || '127.0.0.1',
      },
    },
  ],
};
