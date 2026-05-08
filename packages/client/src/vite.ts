import type { PluginOption } from "vite";

export default function dol(): PluginOption[] {
  return [
    {
      name: "data-of-loathing",
      config() {
        return {
          optimizeDeps: {
            exclude: ["@sqlite.org/sqlite-wasm"],
          },
        };
      },
    },
  ];
}
