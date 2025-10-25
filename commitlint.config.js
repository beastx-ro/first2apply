module.exports = {
  extends: ['@commitlint/config-conventional'],
  // allow up to 120 characters in commit message
  rules: {
    'header-max-length': [2, 'always', 150],
  },
};
