const { spawn } = require('child_process');

const python = process.env.PYTHON || 'python3';
const backendPort = process.env.PYTHON_API_PORT || '8000';
const childEnvironment = {
  ...process.env,
  PYTHON_API_URL: process.env.PYTHON_API_URL || `http://127.0.0.1:${backendPort}`
};
const processes = [
  spawn(python, ['-m', 'uvicorn', 'analysis.api:app', '--host', '127.0.0.1', '--port', backendPort], {
    stdio: 'inherit',
    env: childEnvironment
  }),
  spawn(process.execPath, ['server.js'], {
    stdio: 'inherit',
    env: childEnvironment
  })
];

let shuttingDown = false;
function shutdown(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  processes.forEach((process) => {
    if (!process.killed) process.kill(signal);
  });
}

processes.forEach((child) => {
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      process.exitCode = code || 1;
      shutdown();
    }
  });
});

process.on('SIGINT', () => {
  shuttingDown = true;
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
