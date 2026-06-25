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
process.stdin.resume();
