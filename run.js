const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', ['src/server/index.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

const client = spawn('npx', ['vite', '--config', 'src/client/vite.config.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  client.kill();
  process.exit();
});
