const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
  recommendedConfig: js.configs.recommended,
});
module.exports = [
  ...compat.config({
    extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
    plugins: ['@typescript-eslint', 'react-hooks'],
    parser: '@typescript-eslint/parser',
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  }),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**'],
  },
];
