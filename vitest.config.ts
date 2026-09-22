import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    {
      name: 'js-jsx-loader',
      enforce: 'pre',
      async transform(code, id) {
        if (id.endsWith('.js') && (code.includes('</') || code.includes('/>') || code.includes('<'))) {
          const result = await esbuild.transform(code, {
            loader: 'jsx',
            jsx: 'automatic',
            sourcefile: id,
          });
          return {
            code: result.code,
            map: result.map,
          };
        }
      },
    },
    react({
      include: /\.[jt]sx?$/,
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*test*.{jsx,tsx,js,ts}', '**/*_test.{jsx,tsx,js,ts}', '**/*.test.{jsx,tsx,js,ts}'],
    exclude: ['test/setup.ts', '**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
