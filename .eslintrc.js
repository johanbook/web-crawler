module.exports = {
  extends: ["plugin:sonarjs/recommended", "plugin:unicorn/recommended"],
  plugins: ["sonarjs", "unicorn"],
  rules: {
    "no-console": "error",
    "no-template-curly-in-string": "error",
  },
};
