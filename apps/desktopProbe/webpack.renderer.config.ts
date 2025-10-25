import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import path from "path";
import { plugins } from "./webpack.plugins";

rules.push({
  test: /\.css$/,
  use: [
    { loader: "style-loader" },
    { loader: "css-loader" },
    { loader: "postcss-loader" },
  ],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
  },
};
