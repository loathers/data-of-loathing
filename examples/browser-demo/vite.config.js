import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const corpHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [topLevelAwait(), nodePolyfills({ include: ["buffer", "async_hooks"] })],
  server: { headers: corpHeaders },
  preview: { headers: corpHeaders },
  optimizeDeps: { exclude: ["sqlocal"] },
});
