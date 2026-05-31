//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';

export default [
  ...tanstackConfig,
  {
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
