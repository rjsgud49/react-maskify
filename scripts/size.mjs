import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
for (const f of ['dist/index.js', 'dist/index.cjs']) {
  const b = readFileSync(f);
  console.log(`${f}: ${b.length} B min, ${gzipSync(b, { level: 9 }).length} B gzip`);
}
