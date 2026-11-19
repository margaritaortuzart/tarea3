import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'copy-static-script',
        closeBundle() {
          const src = path.resolve(__dirname, 'script.js');
          const destDir = path.resolve(__dirname, 'dist');
          if (fs.existsSync(src) && fs.existsSync(destDir)) {
            fs.copyFileSync(src, path.join(destDir, 'script.js'));
          }
        },
      },
    ],
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
