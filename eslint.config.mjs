import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ignoredPaths = [
  'art/**',
  'artifacts/**',
  'audio/**',
  'dist/**',
  'node_modules/**',
  'playwright-report/**',
  'src/assets/**',
  'test-results/**'
];

const typescriptFiles = ['src/**/*.ts', 'tests/**/*.ts', 'playwright.config.ts'];

export default tseslint.config(
  { ignores: ignoredPaths },
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      sourceType: 'module'
    },
    rules: {
      ...eslint.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  {
    files: typescriptFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: eslint.configs.recommended.rules
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: typescriptFiles,
    languageOptions: {
      ...config.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  }))
);
