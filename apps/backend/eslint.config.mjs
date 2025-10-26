import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        // Deno globals for Edge Functions
        Deno: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
      },

      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module', // Deno uses ES modules
    },

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_$',
        },
      ],
      // Allow any types for Deno/Supabase Edge Functions where types might be complex
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow console statements in backend/serverless functions
      'no-console': 'off',
      // Allow empty functions (common in webhooks)
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    files: ['supabase/functions/**/*.ts'],
    rules: {
      // Specific rules for Supabase Edge Functions
      '@typescript-eslint/no-explicit-any': 'off', // Edge functions often deal with external APIs
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: [
      'supabase/migrations/**',
      'supabase/seed.sql',
      '**/*.js', // Ignore JS files since we're working with TypeScript
    ],
  },
];
