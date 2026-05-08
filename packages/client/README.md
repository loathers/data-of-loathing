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

The plugin does two things by default:

- Configures Vite's dependency optimiser to prevent pre-bundling of the SQLite WASM
- Polyfills `Buffer` (required by the underlying SQLite driver)

#### OPFS strategy

If you use the `"opfs"` strategy, SQLite requires `SharedArrayBuffer` and `Atomics`, which in turn require cross-origin isolation headers. Pass `{ coi: true }` to enable them on the dev server:

```ts
export default defineConfig({
  plugins: [dol({ coi: true })],
});
```

This sets `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` on the dev server. For production you must set these headers at the hosting layer (e.g. Netlify `_headers`, Vercel `headers` config, nginx). The `credentialless` value is used rather than `require-corp` so cross-origin images are not blocked.
