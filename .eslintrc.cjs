/* eslint-env node */

module.exports = {
  root: true,
  ignorePatterns: ['website'],
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'eslint-plugin-import',
    'eslint-plugin-eslint-comments',
    'eslint-plugin-react-hooks',
  ],
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-plugin/recommended',
    'plugin:eslint-plugin-eslint-comments/recommended',
    'plugin:eslint-plugin-import/recommended',
    'plugin:eslint-plugin-import/typescript',
    'plugin:eslint-plugin-react-hooks/recommended',
    'eslint-config-prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'import/no-cycle': 'error',
    'sort-imports': [
      'warn',
      {
        ignoreDeclarationSort: true,
        ignoreCase: true,
      },
    ],
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external'],
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
};
