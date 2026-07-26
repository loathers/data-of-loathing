import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: "esm",
  target: "node22",
  // dependencies (data-of-loathing, the MCP SDK, zod) stay external and are
  // installed alongside the published package.
  dts: false,
  sourcemap: true,
  // Executable entry point; make it runnable via `npx data-of-loathing-mcp`.
  banner: { js: "#!/usr/bin/env node" },
});
