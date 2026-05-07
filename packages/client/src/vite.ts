import sqlocalPlugin from "sqlocal/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import type { PluginOption } from "vite";

export default function dol(): PluginOption[] {
  return [
    sqlocalPlugin({ coi: false }),
    nodePolyfills({ include: ["buffer"] }),
    {
      name: "data-of-loathing-coi",
      configureServer(server) {
        server.middlewares.use((_, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ];
}
