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

const shutdown = async () => {
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
process.stdin.resume();
