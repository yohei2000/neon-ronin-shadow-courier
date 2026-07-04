import { preview } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

const server = await preview({
  ...createInlineViteConfig(),
  preview: {
    host: '127.0.0.1',
    port: Number(process.env.PORT ?? 4173)
  }
});

server.printUrls();
const keepPreviewAlive = setInterval(() => {}, 2 ** 31 - 1);

const close = async () => {
  clearInterval(keepPreviewAlive);
  await server.httpServer?.close();
  process.exit(0);
};

process.once('SIGINT', close);
process.once('SIGTERM', close);
