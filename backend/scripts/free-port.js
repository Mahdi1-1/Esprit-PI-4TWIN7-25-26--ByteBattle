#!/usr/bin/env node
/*
 * Ensures a TCP port is not occupied before starting Nest.
 * Works on Windows/macOS/Linux with no extra dependencies.
 */
const { execSync } = require('child_process');

function parsePort(value) {
  const fallback = 4001;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > 65535) return fallback;
  return n;
}

function getPidsForPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      const lines = out.split(/\r?\n/).filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        if (!line.includes('LISTENING')) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) pids.add(pid);
      }
      return [...pids];
    }

    const out = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    return out.split(/\r?\n/).filter((pid) => /^\d+$/.test(pid));
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

function main() {
  const port = parsePort(process.argv[2] || process.env.PORT);
  const pids = getPidsForPort(port);

  if (pids.length === 0) {
    console.log(`[free-port] Port ${port} is free.`);
    return;
  }

  const killed = pids.filter(killPid);
  if (killed.length > 0) {
    console.log(`[free-port] Freed port ${port}. Killed PID(s): ${killed.join(', ')}.`);
  } else {
    console.warn(`[free-port] Port ${port} is in use, but no PID could be terminated.`);
  }
}

main();
