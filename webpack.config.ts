import type { Configuration } from "webpack";
import { DefinePlugin, optimize } from "webpack";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import { config } from "dotenv";
import { Configuration as DevServerConfiguration } from "webpack-dev-server";

// Ensure .env.local is loaded, falling back to .env
config({ path: ['.env.local', '.env'] });

const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const isDev = mode === "development";

const webpackConfig: Configuration & DevServerConfiguration = {
  mode,
  context: path.resolve(__dirname, "./"),
  entry: {
    app: path.join(__dirname, "src", "index.tsx"),
  },
  target: "web",
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
    },
    extensions: [".ts", ".tsx", ".js", ".css"],
  },
  infrastructureLogging: {
    level: "none",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        // App CSS (CSS modules)
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [require("cssnano")({ preset: "default" })],
              },
            },
          },
        ],
      },
      {
        // Node modules CSS (e.g. @canva/app-ui-kit/styles.css)
        test: /\.css$/,
        include: /node_modules/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [require("cssnano")({ preset: "default" })],
              },
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            ascii_only: true,
          },
        },
      }),
    ],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new DefinePlugin({
      "process.env.GEMINI_API_KEY": JSON.stringify(process.env.VITE_GEMINI_API_KEY || ""),
    }),
    // Canva apps must be a single JS file
    new optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ].filter(Boolean),
  ...(isDev
    ? {
        devtool: "source-map",
        devServer: {
          server: "https",
          host: "localhost",
          port: 8080,
          allowedHosts: ["localhost"],
          historyApiFallback: {
            rewrites: [{ from: /^\/$/, to: "/app.js" }],
          },
          client: {
            logging: "verbose",
          },
          webSocketServer: false,
        },
      }
    : {}),
};

export default webpackConfig;
