import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
// @ts-expect-error plain JS module without types
import { transform, migrate } from '../bin/migrate.mjs';

const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/app.tsx'), 'utf8');

describe('codemod', () => {
  it('rewrites import, type import, dynamic import, require and jest.mock', () => {
    const { code, count } = transform(fixture);
    expect(count).toBe(5);
    expect(code).toContain(`import InputMask from 'react-maskify/compat';`);
    expect(code).toContain(`import type { Props } from "react-maskify/compat";`);
    expect(code).toContain(`import('react-maskify/compat')`);
    expect(code).toContain(`require('react-maskify/compat')`);
    expect(code).toContain(`jest.mock('react-maskify/compat')`);
    expect(code).toContain('// mention of react-input-mask in a comment stays');
    expect(code).toContain(`'react-input-mask-extra'`);
  });

  it('is idempotent', () => {
    const once = transform(fixture).code;
    expect(transform(once)).toEqual({ code: once, count: 0 });
  });

  it('walks directories, skips node_modules, supports --dry via the CLI', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rm-'));
    fs.mkdirSync(path.join(dir, 'src'));
    fs.mkdirSync(path.join(dir, 'node_modules/x'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src/a.jsx'), fixture);
    fs.writeFileSync(path.join(dir, 'src/b.css'), `/* react-input-mask */`);
    fs.writeFileSync(path.join(dir, 'node_modules/x/i.js'), `require('react-input-mask')`);
    const cli = path.join(__dirname, '../bin/cli.mjs');
    const dry = execFileSync('node', [cli, 'migrate', dir, '--dry'], { encoding: 'utf8' });
    expect(dry).toContain('1 file(s) would be updated');
    expect(fs.readFileSync(path.join(dir, 'src/a.jsx'), 'utf8')).toBe(fixture);
    const changed = migrate([dir], { log: () => {} });
    expect(changed).toEqual([path.join(dir, 'src/a.jsx')]);
    expect(fs.readFileSync(path.join(dir, 'src/a.jsx'), 'utf8')).not.toContain(`from 'react-input-mask'`);
    expect(fs.readFileSync(path.join(dir, 'node_modules/x/i.js'), 'utf8')).toContain('react-input-mask');
  });

  it('prints help for unknown commands', () => {
    const cli = path.join(__dirname, '../bin/cli.mjs');
    expect(execFileSync('node', [cli, '--help'], { encoding: 'utf8' })).toContain('Usage: react-maskify migrate');
  });
});
