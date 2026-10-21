/* global console */
import fs from 'node:fs';
import path from 'node:path';

const EXT = /\.(?:[cm]?[jt]sx?)$/;
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);
// 'react-input-mask' in import/export/require/import()/jest.mock/vi.mock; keeps the original quote style.
const RE = /(\bfrom\s*|\bimport\s*|\brequire\s*\(\s*|\bimport\s*\(\s*|\b(?:jest|vi)\.mock\s*\(\s*)(['"])react-input-mask\2/g;

/** Rewrite react-input-mask module specifiers in one file's source. */
export function transform(source) {
  let count = 0;
  const code = source.replace(RE, (_, pre, q) => {
    count++;
    return `${pre}${q}react-maskify/compat${q}`;
  });
  return { code, count };
}

function* walk(p) {
  const st = fs.statSync(p);
  if (st.isFile()) {
    if (EXT.test(p)) yield p;
    return;
  }
  for (const name of fs.readdirSync(p)) {
    if (SKIP.has(name)) continue;
    yield* walk(path.join(p, name));
  }
}

/** Run the codemod over files/directories. Returns the list of changed files. */
export function migrate(paths, { dry = false, log = console.log } = {}) {
  const changed = [];
  for (const root of paths.length ? paths : ['.']) {
    for (const file of walk(root)) {
      const src = fs.readFileSync(file, 'utf8');
      if (!src.includes('react-input-mask')) continue;
      const { code, count } = transform(src);
      if (!count) continue;
      changed.push(file);
      if (!dry) fs.writeFileSync(file, code);
      log(`${dry ? '[dry] ' : ''}${file}: ${count} import${count > 1 ? 's' : ''}`);
    }
  }
  return changed;
}
