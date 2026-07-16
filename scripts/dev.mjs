import { createServer } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const server = await createServer({
  ...createInlineViteConfig(),
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT ?? 5173)
  }
});

await server.listen();
server.printUrls();

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await server.close();
  } finally {
    process.exit(0);
  }
};

process.once('SIGHUP', () => void shutdown());
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
process.stdin.resume();
