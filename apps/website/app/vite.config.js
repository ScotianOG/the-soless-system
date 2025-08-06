const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

// Only include VITE_ prefixed env vars
const envPrefix = "VITE_";
const clientEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.startsWith(envPrefix))
);

module.exports = defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.md"], // Add markdown files as assets
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@keystonehq/bc-ur-registry": path.resolve(
        __dirname,
        "node_modules/@keystonehq/bc-ur-registry/dist/index.js"
      ),
      "@keystonehq/sol-keyring": path.resolve(
        __dirname,
        "node_modules/@keystonehq/sol-keyring/dist/index.js"
      ),
      // Node polyfills
      stream: "stream-browserify",
      buffer: "buffer",
      util: "util",
      process: path.resolve(__dirname, "node_modules/process/browser.js"),
      events: "events",
      crypto: "crypto-browserify",
      assert: "assert",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify/browser",
      url: "url",
      zlib: "browserify-zlib",
      path: "path-browserify",
      querystring: "querystring-es3",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      supported: {
        bigint: true,
      },
    },
    include: [
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-base",
      "react-router-dom",
      "@formspree/react",
      "recharts",
      "axios",
      "buffer",
      "process",
      "events",
      "stream-browserify",
      "util",
    ],
    exclude: [
      "@keystonehq/bc-ur-registry",
      "@keystonehq/sol-keyring",
      "ev-emitter",
      "@reown/walletkit",
    ],
  },
  define: {
    "process.env": clientEnv,
    global: "globalThis",
    "process.browser": true,
    "process.version": '"v16.0.0"',
  },
  build: {
    target: "esnext",
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/, /\@solana\/web3\.js/],
    },
    rollupOptions: {
      external: [
        "@keystonehq/bc-ur-registry",
        "@keystonehq/sol-keyring",
        "ev-emitter",
        "@trezor/env-utils",
        "@trezor/utils",
        "@trezor/connect",
      ],
      output: {
        manualChunks: {
          vendor: ["axios", "@solana/web3.js", "buffer"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    proxy: {
      // Route chatbot-specific API calls to AI Engine (port 3000)
      "/api/conversations": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/api/chatbot": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/chatbot/, "/api"),
      },
      // Route all other API calls to Contest Server (port 3001)
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});
