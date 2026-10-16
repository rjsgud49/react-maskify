import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'demo', 'test-results', 'playwright-report', 'e2e/vite.config.ts', 'playwright.config.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': hooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
    },
  },
);
