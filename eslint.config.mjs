import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import unusedImports from 'eslint-plugin-unused-imports';

/**
 * Lint rules.
 *
 * CLAUDE.md has stated "no unused imports, variables, or functions" and "no
 * `any` types" as project rules for as long as it has existed, with nothing
 * enforcing either. TypeScript reports unused declarations as *hints* that do
 * not fail a build, and it has nothing to say about `any` at all — so both rules
 * were honoured by memory, and there are violations of each in the tree today.
 *
 * This is that pair of rules, made mechanical. It is deliberately small: rules
 * nobody agreed to are noise, and noise is how a lint config gets disabled.
 *
 * `eslint-config-prettier` comes last so nothing here argues with the formatter.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.astro/**',
      '**/.vercel/**',
      '**/node_modules/**',
      'packages/web/src/env.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  {
    // Flat config declares no environment globals by default, so `console`,
    // `process` and the timer functions are undefined everywhere without this.
    // Server code is Node; the web package also runs in a browser.
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['packages/web/**'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },

  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // CLAUDE.md rule 2. The user's standing instruction is stronger than the
      // default here: `any` is an error, not a warning.
      '@typescript-eslint/no-explicit-any': 'error',

      // CLAUDE.md rule 1, split in two so the common case is auto-fixable.
      // `unused-imports/no-unused-imports` can delete a dead import safely;
      // an unused *variable* usually means the surrounding code is wrong, so
      // that one is reported and left for a person.
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',

      // Base rule off; the TypeScript-aware version above replaces it.
      'no-unused-vars': 'off',
    },
  },

  {
    // Tests mock third-party SDKs whose real types are enormous and mostly
    // irrelevant to what is being asserted. `as any` on a fixture is a
    // deliberate narrowing of scope, not sloppiness, so it is a warning here —
    // visible, but not a reason to fail the build.
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  {
    // Console output is how the server reports what it did.
    files: ['packages/api/**', 'packages/core/**', 'scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },

  prettier
);
