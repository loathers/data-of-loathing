import { defineConfig } from "vite";
import dol from "data-of-loathing/vite";

export default defineConfig({
  plugins: [dol({ coi: true })],
  build: { outDir: "dist/public", target: "esnext" },
});
