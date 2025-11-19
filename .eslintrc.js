module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'google',
    'prettier'
  ],
  plugins: [
    'jsdoc',
    'mocha',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: './tsconfig.json'
  },
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  rules: {
    'prettier/prettier': 'error',
    'jsdoc/require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true
      }
    }],
    'mocha/no-exclusive-tests': 'error'
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended'
      ],
      plugins: [
        '@typescript-eslint'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    }
  ]
};