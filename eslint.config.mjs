import eslint from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import { readdir } from 'fs/promises';
import tseslint from 'typescript-eslint';

const rootDirs = (await readdir(import.meta.dirname, { withFileTypes: true }))
  .filter((x) => x.isDirectory())
  .map((x) => x.name);

export default tseslint.config(
  {
    // Global ignores, won't run any processing on these files
    ignores: [
      '*.*', // Ignore every root-level file
      // Ignore every directory besides src
      ...rootDirs.filter((x) => x !== 'src'),
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  ...[
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    jsdoc.configs['flat/recommended-typescript'],
  ].map((config) => ({
    ...config,
  })),
  {
    ignores: ['**/*.spec.ts'],

    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      yoda: ['warn', 'never', { exceptRange: true }],
      curly: ['warn', 'multi-line', 'consistent'],
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-unreachable-loop': 'warn',
      'require-atomic-updates': 'warn',
      'grouped-accessor-pairs': 'warn',
      'guard-for-in': 'warn',
      'max-classes-per-file': ['warn', 3],
      'logical-assignment-operators': 'warn',
      'no-empty-function': ['warn', { allow: ['arrowFunctions', 'constructors'] }],
      'no-array-constructor': 'warn',
      'no-new-wrappers': 'warn',
      'no-useless-return': 'warn',
      'operator-assignment': 'warn',
      'prefer-object-spread': 'warn',
      'prefer-regex-literals': 'warn',
      'require-await': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-unnecessary-condition': [
        'warn',
        { allowConstantLoopConditions: true },
      ],
      '@typescript-eslint/no-confusing-void-expression': [
        'warn',
        { ignoreArrowShorthand: true },
      ],
      '@typescript-eslint/no-unnecessary-type-parameters': 'warn', // This rule has false positives
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/max-params': ['warn', { max: 7 }],
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: {
            memberTypes: [
              // Index signature
              'signature',
              'call-signature',

              // Fields
              'public-static-field',
              'protected-static-field',
              'private-static-field',
              '#private-static-field',

              'public-decorated-field',
              'protected-decorated-field',
              'private-decorated-field',

              'public-instance-field',
              'protected-instance-field',
              'private-instance-field',
              '#private-instance-field',

              'public-abstract-field',
              'protected-abstract-field',

              'public-field',
              'protected-field',
              'private-field',
              '#private-field',

              'static-field',
              'instance-field',
              'abstract-field',

              'decorated-field',

              'field',

              // Static initialization
              'static-initialization',

              // Constructors
              'public-constructor',
              'protected-constructor',
              'private-constructor',

              'constructor',

              // Accessors
              'public-static-accessor',
              'protected-static-accessor',
              'private-static-accessor',
              '#private-static-accessor',

              'public-decorated-accessor',
              'protected-decorated-accessor',
              'private-decorated-accessor',

              'public-instance-accessor',
              'protected-instance-accessor',
              'private-instance-accessor',
              '#private-instance-accessor',

              'public-abstract-accessor',
              'protected-abstract-accessor',

              'public-accessor',
              'protected-accessor',
              'private-accessor',
              '#private-accessor',

              'static-accessor',
              'instance-accessor',
              'abstract-accessor',

              'decorated-accessor',

              'accessor',

              ['get', 'set'],

              // Methods
              'public-static-method',
              'protected-static-method',
              'private-static-method',
              '#private-static-method',

              'public-decorated-method',
              'protected-decorated-method',
              'private-decorated-method',

              'public-instance-method',
              'protected-instance-method',
              'private-instance-method',
              '#private-instance-method',

              'public-abstract-method',
              'protected-abstract-method',

              'public-method',
              'protected-method',
              'private-method',
              '#private-method',

              'static-method',
              'instance-method',
              'abstract-method',

              'decorated-method',

              'method',
            ],
          },
        },
      ],
      '@typescript-eslint/no-loop-func': 'warn',
      '@typescript-eslint/no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '[iI]gnored?$',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-throws': 'warn',
    },
  },
);
