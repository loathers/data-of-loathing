import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      browser: "src/browser.ts",
      node: "src/node.ts",
      vite: "src/vite.ts",
    },
    format: "esm",
    dts: true,
    sourcemap: true,
  },
  {
    entry: {
      "workers/memory": "src/workers/memory.ts",
      "workers/opfs": "src/workers/opfs.ts",
      "workers/ranged": "src/workers/ranged.ts",
    },
    format: "esm",
    dts: false,
    sourcemap: true,
  },
]);
