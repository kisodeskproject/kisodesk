// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    'node_modules/',
    'dist/',
    'build/',
    'out/',
    '.next/',
    'coverage/',
    'tmp/',
    'temp/',
    '.cache/',
    '.eslintcache/',
    '.vscode/',
    '*.log',
    '*.lock',
    '*.min.js',
    '*.min.css',
    '*.config.js',
    '*.config.mjs',
    '*.config.cjs',
    '**/jest.config.js',
    'next-env.d.ts',
  ]),

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
        React: 'readonly',
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
      react: react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'react/prop-types': 'off',
      'import/order': 'off',
      'import/no-cycle': 'error',
      'import/no-default-export': 'off',
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },

  {
    files: ['**/*.test.{ts,tsx,js,jsx}'],
    languageOptions: { globals: { ...globals.jest } },
    rules: { 'import/no-default-export': 'off' },
  },

  {
    files: [
      'app/**/page.{ts,tsx}',
      'app/**/layout.{ts,tsx}',
      'pages/**/*.{ts,tsx}',
      'pages/api/**/*.{ts,tsx}',
    ],
    rules: { 'import/no-default-export': 'off' },
  },

  {
    files: [
      'next.config.{js,cjs,mjs,ts}',
      'jest.config.{js,cjs,mjs,ts}',
      'tailwind.config.{js,cjs,mjs,ts}',
      'postcss.config.{js,cjs,mjs,ts}',
      '**/*.config.{js,cjs,mjs,ts}',
      '**/scripts/**/*.{js,ts}',
    ],
    rules: { 'import/no-unresolved': 'off', 'import/no-default-export': 'off' },
  },
]);
