import { spawn } from 'node:child_process';
import path from 'node:path';
import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5176);
const timeoutMs = Number(process.env.PLAYWRIGHT_SMOKE_TIMEOUT_MS ?? (process.env.CI ? 150_000 : 90_000));
let server;
let child;
let childResultPromise;
let childTimeout;
let cleanupPromise;
let terminateChildPromise;
let interruptedSignal;
let timedOut = false;

const terminationGraceMs = 5_000;

const waitForProcess = (processHandle) =>
  new Promise((resolve, reject) => {
    processHandle.once('error', reject);
    processHandle.once('exit', (code, signal) => resolve({ code, signal }));
  });

const waitForSettlement = async (promise, timeoutMs) => {
  let timeout;
  try {
    return await Promise.race([
      promise.then(
        () => true,
        () => true
      ),
      new Promise((resolve) => {
        timeout = setTimeout(() => resolve(false), timeoutMs);
        timeout.unref?.();
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const signalProcessTree = (processHandle, signal) => {
  try {
    process.kill(-processHandle.pid, signal);
    return;
  } catch {
    try {
      processHandle.kill(signal);
    } catch (error) {
      if (error?.code !== 'ESRCH') throw error;
    }
  }
};

const terminateChild = async () => {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  if (terminateChildPromise) return terminateChildPromise;

  const ownedChild = child;
  const ownedChildResult = childResultPromise ?? waitForProcess(ownedChild);
  const attempt = (async () => {
    if (process.platform === 'win32') {
      const taskkill = spawn('taskkill.exe', ['/pid', String(ownedChild.pid), '/T', '/F'], {
        shell: false,
        stdio: 'ignore',
        windowsHide: true
      });
      const result = await waitForProcess(taskkill).catch(() => ({ code: 1 }));
      if (result.code !== 0 && ownedChild.exitCode === null) ownedChild.kill();
    } else {
      signalProcessTree(ownedChild, 'SIGTERM');
    }

    if (await waitForSettlement(ownedChildResult, terminationGraceMs)) return;

    if (process.platform === 'win32') {
      ownedChild.kill();
    } else {
      signalProcessTree(ownedChild, 'SIGKILL');
    }

    if (!(await waitForSettlement(ownedChildResult, terminationGraceMs))) {
      throw new Error(`Playwright smoke process tree ${ownedChild.pid} did not exit after forced termination`);
    }
  })();
  terminateChildPromise = attempt;

  try {
    await attempt;
  } finally {
    if (terminateChildPromise === attempt) terminateChildPromise = undefined;
  }
};

const cleanup = async () => {
  if (cleanupPromise) return cleanupPromise;

  const attempt = (async () => {
    if (childTimeout) clearTimeout(childTimeout);
    childTimeout = undefined;
    const failures = [];

    try {
      await terminateChild();
    } catch (error) {
      failures.push(error);
    }

    const ownedServer = server;
    server = undefined;
    if (ownedServer) {
      try {
        ownedServer.httpServer?.closeAllConnections?.();
        await ownedServer.close();
      } catch (error) {
        failures.push(error);
      }
    }

    if (failures.length === 1) throw failures[0];
    if (failures.length > 1) throw new AggregateError(failures, 'Failed to close Playwright smoke resources');
  })();
  cleanupPromise = attempt;

  try {
    await attempt;
  } finally {
    if (cleanupPromise === attempt) cleanupPromise = undefined;
  }
};

const handleSignal = (signal, exitCode) => {
  if (interruptedSignal) return;
  interruptedSignal = signal;
  process.exitCode = exitCode;
  console.error(`Playwright smoke received ${signal}; cleaning up owned processes`);
  void cleanup().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  });
};

const onSigint = () => handleSignal('SIGINT', 130);
const onSigterm = () => handleSignal('SIGTERM', 143);
process.on('SIGINT', onSigint);
process.on('SIGTERM', onSigterm);

try {
  server = await createServer({
    ...createInlineViteConfig(),
    cacheDir: path.resolve('node_modules', '.vite-automation'),
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      watch: {
        ignored: ['**/artifacts/**', '**/playwright-report/**', '**/test-results/**']
      }
    }
  });
  if (interruptedSignal) throw new Error(`Playwright smoke interrupted by ${interruptedSignal}`);
  await server.listen();
  if (interruptedSignal) throw new Error(`Playwright smoke interrupted by ${interruptedSignal}`);

  const address = server.httpServer?.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const baseURL = `http://127.0.0.1:${actualPort}`;
  const cli = path.resolve('node_modules', '@playwright', 'test', 'cli.js');
  child = spawn(process.execPath, [cli, 'test', '--grep', '@smoke', ...process.argv.slice(2)], {
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseURL
    },
    shell: false,
    stdio: 'inherit',
    windowsHide: true
  });

  childResultPromise = waitForProcess(child);
  if (interruptedSignal) {
    await terminateChild();
    throw new Error(`Playwright smoke interrupted by ${interruptedSignal}`);
  }
  childTimeout = setTimeout(() => {
    timedOut = true;
    process.exitCode = 1;
    console.error(`Playwright smoke exceeded ${timeoutMs}ms; terminating its process tree`);
    void terminateChild().catch((error) => {
      console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    });
  }, timeoutMs);

  const result = await childResultPromise;
  clearTimeout(childTimeout);
  childTimeout = undefined;
  if (timedOut) throw new Error(`Playwright smoke timed out after ${timeoutMs}ms`);
  if (interruptedSignal) throw new Error(`Playwright smoke interrupted by ${interruptedSignal}`);
  if (result.code !== 0) process.exitCode = result.code ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  if (!process.exitCode) process.exitCode = 1;
} finally {
  try {
    await cleanup();
  } finally {
    process.off('SIGINT', onSigint);
    process.off('SIGTERM', onSigterm);
  }
}
