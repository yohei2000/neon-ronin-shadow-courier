export function createInlineViteConfig() {
  return {
    root: process.cwd(),
    configFile: false,
    base: process.env.VITE_BASE ?? '/',
    resolve: {
      alias: {
        phaser: 'phaser/dist/phaser.esm.js'
      }
    },
    optimizeDeps: {
      exclude: ['phaser']
    },
    build: {
      chunkSizeWarningLimit: 1700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/phaser') || id.includes('phaser/dist')) {
              return 'vendor-phaser';
            }
            return undefined;
          }
        }
      }
    }
  };
}
