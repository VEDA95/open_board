//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';
import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    ignores: [
      'supabase/**',
      // Build output — present after `pnpm build`, and bundled JS trips every
      // stylistic rule.
      '.output/**',
      '.nitro/**',
      'dist/**',
      'src/lib/types/supabase.ts',
      'src/routeTree.gen.ts',
    ],
  },
  ...tanstackConfig,
  {
    // Flat config scopes plugins per config object, so these overrides have to
    // register @stylistic themselves — inheriting it from tanstackConfig above
    // only appeared to work while a stray hoisted node_modules/@stylistic link
    // happened to exist.
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/jsx-self-closing-comp': ['error', {
        'component': true,
        'html': true
      }],
      '@stylistic/semi': ['error', 'always', { 'omitLastInOneLineClassBody': true}],
      '@stylistic/no-extra-semi': ['error']
    },
  },
];
