// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: false,
  parserOptions: {
    // parser: 'babel-eslint'
  },
  env: {
    browser: true,
    mocha: true
  },
  globals: {
    expect: true,
    should: true,
    sinon: true,
    DB: true
  },
  extends: [
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],

  plugins: ['mocha'],
  // add your custom rules here
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    'space-before-function-paren': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
}
