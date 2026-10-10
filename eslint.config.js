import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      /**
       * Two rules added in eslint-plugin-react-hooks v7, kept visible as
       * warnings rather than enforced as errors.
       *
       * They target the React Compiler's stricter model. `set-state-in-effect`
       * fires on the pattern every page here uses — fetch in an effect, then
       * setState with the result — which is correct under React 18 and is how
       * the data layer is built. Silencing them would hide genuinely useful
       * advice; erroring on them would mean rewriting seven working
       * data-loading paths for no behavioural gain. Revisit when moving to
       * React 19 and the compiler, where the refactor pays for itself.
       */
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  }
);
