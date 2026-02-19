import { rspack } from "@rspack/core";
import path from "path";
import { fileURLToPath } from "url";
import sveltePreprocess from "svelte-preprocess";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mode = process.env.NODE_ENV || "development";
const prod = mode === "production";

// Strapi API URL for fetching layouts
const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

export default {
  entry: "./src/main.ts",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    publicPath: "/",
    clean: true,
  },

  resolve: {
    alias: {
      svelte: path.resolve(__dirname, "node_modules", "svelte"),
    },
    extensions: [".mjs", ".js", ".ts", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"],
  },

  devServer: {
    port: 3001,
    hot: true,
    historyApiFallback: true,
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },

  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            compilerOptions: {
              dev: !prod,
            },
            emitCss: prod,
            hotReload: !prod,
            preprocess: sveltePreprocess({
              sourceMap: !prod,
            }),
          },
        },
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        type: "javascript/auto",
      },
      {
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },

  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./src/index.html",
    }),
    new rspack.DefinePlugin({
      __STRAPI_URL__: JSON.stringify(STRAPI_URL),
    }),
    // Module Federation consumer - dynamically loads remotes based on layout data
    new rspack.container.ModuleFederationPlugin({
      name: "layoutRenderer",
      // Remotes will be loaded dynamically at runtime
      remotes: {},
      shared: {
        svelte: {
          singleton: true,
          eager: true,
          requiredVersion: "^3.58.0",
        },
      },
    }),
  ],

  mode,
  devtool: prod ? false : "source-map",
};
