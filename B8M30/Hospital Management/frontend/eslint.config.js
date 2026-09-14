import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist/**', 'scripts/dist/**', 'node_modules/**'] },

  // Application source — browser globals, React 19 JSX transform.
  {
    files: ['src/**/*.{js,jsx}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      // The automatic JSX runtime means React needn't be in scope.
      ...react.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Components take plain objects from the API; prop-types would be
      // noise without adding safety. TypeScript is the real fix if wanted.
      'react/prop-types': 'off',

      // Ignore unused catch bindings and SCREAMING_SNAKE constants, but
      // nothing else. The Vite template's `^[A-Z_]` is too broad — it
      // silently excuses every unused component and icon import.
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z][A-Z0-9_]*$',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },

  // Build/check scripts run in Node, not the browser.
  {
    files: ['scripts/**/*.js', '*.config.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
]
