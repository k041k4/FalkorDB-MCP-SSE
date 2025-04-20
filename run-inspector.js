const { spawn } = require('child_process');
const path = require('path');

// Get the path to npx
const npxPath = path.join(process.env.APPDATA, 'npm', 'npx.cmd');

const env = {
  ...process.env,
  CLIENT_PORT: '8080',
  SERVER_PORT: '9000',
  NODE_ENV: 'development'
};

console.log('Starting MCP Inspector...');
console.log('Using npx path:', npxPath);

const inspector = spawn(npxPath, [
  '@modelcontextprotocol/inspector',
  '--url',
  'http://localhost:3000/api/mcp',
  '--env',
  'development'
], {
  env,
  stdio: 'inherit',
  shell: true
});

inspector.on('error', (err) => {
  console.error('Failed to start inspector:', err);
});

inspector.on('close', (code) => {
  console.log(`Inspector process exited with code ${code}`);
}); 