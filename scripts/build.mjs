import { build } from 'vite';
import { createInlineViteConfig } from './vite-inline-config.mjs';

await build(createInlineViteConfig());
