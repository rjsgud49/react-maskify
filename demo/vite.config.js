import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Inside the repo, use the library source so the demo always shows the current code.
// On StackBlitz / standalone, fall back to the published npm package.
const local = fileURLToPath(new URL('../src/index.ts', import.meta.url));
export default defineConfig({
  base: process.env.DEMO_BASE || '/',
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'], alias: existsSync(local) && !process.env.USE_NPM ? { 'react-maskify': local } : {} },
});
