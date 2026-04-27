// ESLint flat config. Kept deliberately permissive on existing code so
// `npm run lint` returns a useful, scrollable signal instead of a wall of
// thousands of warnings. Tighten rules over time as we clean up.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      'dist',
      'out',
      'docs',
      'web',
      'node_modules',
      'playwright-report',
      'test-results',
      'firmware-test-apps',
      '**/*.config.{js,cjs,mjs,ts}',
      'scripts/**',
      'local-storage-data/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // react-hooks v6+ added perf-hint rules ("set-state-in-effect" etc.)
      // that fire on real but non-blocking patterns. Downgrade to warn so
      // they're visible without blocking; keep rules-of-hooks at error
      // since that one catches genuine bugs.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      // Existing code base has a lot of legitimate-but-unfortunate `any` and
      // unused symbols. Downgrade to `warn` so new code can be held to the
      // standard without making lint failure a CI blocker on day one.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // TS 8 / typescript-eslint 8 raised these to errors; downgrade until
      // the existing call sites get cleaned up.
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-empty': 'warn',
      'no-empty-pattern': 'warn',
      'no-prototype-builtins': 'warn',
      'no-fallthrough': 'warn',
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
      'no-async-promise-executor': 'warn',
      'no-misleading-character-class': 'warn',
      'prefer-const': 'warn',
      // Newer rules that we'll tighten over time.
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
      'no-var': 'warn',
      // react-hooks/rules-of-hooks is a real-bug rule — keep at error.
    },
  },
  {
    // Inline `eslint-disable` comments still reference rules from plugins we
    // haven't installed (e.g. `import/no-cycle`). ESLint 9 reports unknown
    // rules referenced by disable comments as errors; silence that noise so
    // lint output is actionable. Once eslint-plugin-import is added the
    // entries it provides will start being recognised.
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
];
