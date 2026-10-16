import { defineConfig } from 'vite';
export default defineConfig({ root: __dirname + '/fixture', esbuild: { jsx: 'automatic' }, server: { port: 5179, strictPort: true } });
