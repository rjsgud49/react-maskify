import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

// Build into a dir inside the repo so `react` resolves and `"type": "module"` applies.
const root = path.join(__dirname, '..');
const out = path.join(root, 'node_modules/.cache/build-test');
const node = (code: string) => execFileSync('node', ['--input-type=module', '-e', code], { cwd: out, encoding: 'utf8' }).trim();
// `.bin/tsup` is `tsup.cmd` on Windows, so run the JS entry with this Node.
const require = createRequire(import.meta.url);
const tsupPkg = require.resolve('tsup/package.json');
const tsupCli = path.join(path.dirname(tsupPkg), (require(tsupPkg) as { bin: { tsup: string } }).bin.tsup);

beforeAll(() => {
  fs.rmSync(out, { recursive: true, force: true });
  execFileSync(process.execPath, [tsupCli, '--out-dir', out, '--no-dts'], { cwd: root, stdio: 'pipe' });
}, 60_000);
afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

describe('build output', () => {
  it('CJS: main and compat entries export the same component', () => {
    const code = `import { createRequire } from 'node:module';
      const r = createRequire(import.meta.url);
      const a = r('./index.cjs').default, b = r('./compat.cjs').default;
      console.log(!!a && a === b);`;
    expect(node(code)).toBe('true');
  });

  it('ESM: main and compat entries export the same component', () => {
    const code = `const a = (await import('./index.js')).default, b = (await import('./compat.js')).default;
      console.log(!!a && a === b);`;
    expect(node(code)).toBe('true');
  });
});
