module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended'],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
    rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': 'error',

        // General ESLint rules
        'no-console': 'warn',
        'no-debugger': 'error',
        'no-duplicate-imports': 'error',
        'no-unused-expressions': 'error',
        'prefer-const': 'error',
        'no-var': 'error',

        // Code style
        'indent': ['error', 2],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'always-multiline'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],

        // Whitespace rules
        'no-trailing-spaces': 'error',
        'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }],
        'eol-last': ['error', 'always'],
        'space-before-blocks': 'error',
        'space-infix-ops': 'error',
        'keyword-spacing': 'error',
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],

        // Best practices
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
    },
};