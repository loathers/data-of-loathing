import { nodePolyfills } from "vite-plugin-node-polyfills";
import type { Plugin, PluginOption } from "vite";

export default function dol({
  coi = false,
}: { coi?: boolean } = {}): PluginOption[] {
  const plugin: Plugin = {
    name: "data-of-loathing",
    config() {
      return {
        optimizeDeps: {
          exclude: ["data-of-loathing", "@sqlite.org/sqlite-wasm"],
        },
      };
    },
  };

  if (coi) {
    plugin.configureServer = (server) => {
      server.middlewares.use((_, res, next) => {
        res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        next();
      });
    };
  }

  return [
    nodePolyfills({ include: ["buffer"], globals: { process: false } }),
    plugin,
  ];
}
