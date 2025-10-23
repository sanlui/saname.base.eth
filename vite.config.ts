// FIX: Removed reference to "node" types which was causing an error.
// Instead, we import `process` directly to get the necessary types.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { cp, access } from 'fs/promises';
import process from 'node:process';

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to copy the .well-known directory to the output directory on build.
    // This is necessary because it's a dot-folder in the root, not in the `public` directory.
    {
      name: 'copy-well-known',
      apply: 'build',
      async writeBundle(outputOptions) {
        const outDir = outputOptions.dir || resolve(process.cwd(), 'dist');
        const sourcePath = resolve(process.cwd(), '.well-known');
        const destPath = resolve(outDir, '.well-known');

        try {
          // Check if source directory exists before attempting to copy
          await access(sourcePath);
          await cp(sourcePath, destPath, { recursive: true });
        } catch (error) {
          // If the source directory doesn't exist, we can silently ignore.
          // For any other errors, log them to the console.
          // FIX: Replaced `NodeJS.ErrnoException` with a generic type to avoid relying on global NodeJS types.
          if ((error as { code: string }).code !== 'ENOENT') {
            console.error('An error occurred while copying the .well-known directory:', error);
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    // The custom plugin above ensures files in the .well-known folder are included in the build.
  },
  server: {
    // No special server configuration is needed for serving the .well-known directory.
    // Vite's dev server serves from the project root by default, which will include it.
  }
});
