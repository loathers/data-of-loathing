import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "data-of-loathing";
import { registerTools } from "./tools.js";

async function main() {
  // DOL_SQLITE_PATH points at a local database file (useful offline / in dev).
  // Otherwise the client downloads and ETag-caches dol.sqlite from data.loathers.net.
  const localPath = process.env.DOL_SQLITE_PATH;
  const client = localPath
    ? createClient({ strategy: "local", path: localPath })
    : createClient();

  await client.load();

  const server = new McpServer({
    name: "data-of-loathing",
    version: "0.0.1",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdout is reserved for the MCP protocol; log to stderr.
  console.error("data-of-loathing MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting data-of-loathing MCP server:", error);
  process.exit(1);
});
