const globals = require("globals");

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        marked: "readonly",
        DOMPurify: "readonly"
      }
    },
    rules: {
      "indent": ["error", 2],
      "linebreak-style": ["error", "unix"],
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "no-unused-vars": "warn",
      "no-console": ["warn", { "allow": ["error", "warn"] }],
      "camelcase": "warn",
      "max-len": ["warn", { "code": 80 }]
    }
  }
];