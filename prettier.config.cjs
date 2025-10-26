module.exports = {
  printWidth: 120,
  singleQuote: true,
  importOrder: [
    'env',
    '^[./].*instrumentation$', // More specific pattern for instrumentation imports
    '<THIRD_PARTY_MODULES>',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['explicitResourceManagement', 'typescript', 'jsx'],
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
};
