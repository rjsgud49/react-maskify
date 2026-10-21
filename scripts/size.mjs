/* global console */
// Minified + gzipped size of each entry with its shared chunks, react external.
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
for (const entry of ['index', 'compat', 'presets']) {
  const r = await build({
    entryPoints: [`dist/${entry}.js`],
    bundle: true,
    minify: true,
    write: false,
    format: 'esm',
    external: ['react', 'react/jsx-runtime'],
  });
  const b = r.outputFiles[0].contents;
  console.log(`react-maskify${entry == 'index' ? '' : '/' + entry}: ${b.length} B min, ${gzipSync(b, { level: 9 }).length} B gzip`);
}
// Tree-shaking check: importing one validator should not pull in the React component.
const one = await build({
  stdin: { contents: `export { isValidBizNoKR } from './dist/presets.js'`, resolveDir: '.' },
  bundle: true, minify: true, write: false, format: 'esm', external: ['react', 'react/jsx-runtime'],
});
const s = one.outputFiles[0].contents;
console.log(`presets, isValidBizNoKR only: ${s.length} B min, ${gzipSync(s, { level: 9 }).length} B gzip`);
