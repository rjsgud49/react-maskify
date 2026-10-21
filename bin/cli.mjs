#!/usr/bin/env node
/* global console, process */
import { migrate } from './migrate.mjs';

const [cmd, ...args] = process.argv.slice(2);
const help = `Usage: react-maskify migrate [paths...] [--dry]

Rewrites imports of 'react-input-mask' to 'react-maskify/compat'
in .js/.jsx/.ts/.tsx/.mjs/.cjs files (node_modules, dist and build are skipped).
  --dry   list the files that would change without writing them`;

if (cmd !== 'migrate') {
  console.log(help);
  process.exit(cmd && cmd !== '--help' && cmd !== '-h' ? 1 : 0);
}
const dry = args.includes('--dry');
const changed = migrate(args.filter((a) => !a.startsWith('--')), { dry });
console.log(`\n${changed.length} file(s) ${dry ? 'would be ' : ''}updated.`);
if (changed.length && !dry) {
  console.log('Next: npm uninstall react-input-mask @types/react-input-mask && npm install react-maskify');
}
