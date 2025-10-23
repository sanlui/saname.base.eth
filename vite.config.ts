import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { cp, access } from 'fs/promises';

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to copy the .well-known directory
    {
      name: 'copy-well-known',
      apply: 'build',
      async writeBundle(outputOptions) {
        const outDir = outputOptions.dir || resolve(process.cwd(), 'dist');
        const sourcePath = resolve(process.cwd(), '.well-known');
        const destPath = resolve(outDir, '.well-known');

        try {
          await access(sourcePath);
          await cp(sourcePath, destPath, { recursive: true });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('Error copying .well-known:', error);
          }
        }
      },
    },
    // 🔥 AGGIUNGI QUESTO: Copia i file dalla cartella public/ nella root del build
    {
      name: 'copy-public-files',
      apply: 'build',
      async writeBundle(outputOptions) {
        const outDir = outputOptions.dir || resolve(process.cwd(), 'dist');
        const publicPath = resolve(process.cwd(), 'public');
        
        try {
          await access(publicPath);
          // Copia tutti i file dalla cartella public/ alla root del build
          await cp(publicPath, outDir, { recursive: true });
          console.log('✅ Public files copied to dist root');
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('Error copying public files:', error);
          }
        }
      },
    }
  ],
  build: {
    outDir: 'dist',
  },
  server: {}
});
