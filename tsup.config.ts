import { defineConfig } from 'tsup';
export default defineConfig({
  entry: { index: 'src/index.ts', compat: 'src/compat.ts', presets: 'src/presets/index.ts' },
  format: ['esm', 'cjs'],
  // Share chunks in CJS too, so react-maskify and react-maskify/compat export the same component.
  splitting: true,
  dts: true,
  clean: true,
  minify: true,
  target: 'es2019',
  external: ['react', 'react/jsx-runtime'],
});
