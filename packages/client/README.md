# data-of-loathing

A client SDK for the data-of-loathing service.

## Browser usage

The browser client uses [SQLocal](https://sqlocal.dev) (SQLite over WASM) under the hood. To use it in a browser app you will need to install the optional peer dependencies as dev dependencies:

```sh
npm install -D sqlocal vite-plugin-node-polyfills
```

### Vite

A Vite plugin is provided that handles the required configuration:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import dol from "data-of-loathing/vite";

export default defineConfig({
  plugins: [dol()],
});
```

The plugin does three things:

- Configures Vite's dependency optimiser and worker format for SQLocal's WASM worker
- Polyfills `Buffer` (required by the underlying SQLite driver)
- Sets `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` on the dev server so SharedArrayBuffer is available without blocking cross-origin images — for production you must set these headers at the hosting layer (e.g. Netlify `_headers`, Vercel `headers` config, nginx)
