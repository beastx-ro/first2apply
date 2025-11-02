module.exports = {
  printWidth: 120,
  singleQuote: true,
  importOrder: [
    'env',
    'react',
    '^[./].*instrumentation$', // More specific pattern for instrumentation imports
    '<THIRD_PARTY_MODULES>',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ['explicitResourceManagement', 'typescript', 'jsx'],
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: ['**/libraries/ui/src/**/*.{ts,tsx,css}'],
      options: {
        printWidth: 80,
        singleQuote: false,
        trailingComma: 'es5',
        semi: false,
        plugins: ['prettier-plugin-tailwindcss'],
      },
    },
  ],
};
