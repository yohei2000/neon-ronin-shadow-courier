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
    }
  };
}
