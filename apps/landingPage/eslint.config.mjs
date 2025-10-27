import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const config = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Use "ignores" to specify patterns to ignore
    ignores: [],
  },
];
export default config;
