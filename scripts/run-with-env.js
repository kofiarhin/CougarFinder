#!/usr/bin/env node
const { spawn } = require('child_process');

const [, , envAssignment, ...commandParts] = process.argv;

const exitWithUsage = () => {
  process.stderr.write('Usage: node scripts/run-with-env.js KEY=value command [args...]\n');
  process.exit(1);
};

if (!envAssignment || commandParts.length === 0) {
  exitWithUsage();
}

const [key, value] = envAssignment.split('=');

if (!key || typeof value === 'undefined') {
  exitWithUsage();
}

const child = spawn(commandParts[0], commandParts.slice(1), {
  stdio: 'inherit',
  env: {
    ...process.env,
    [key]: value
  }
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
