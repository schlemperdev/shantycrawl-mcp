#!/usr/bin/env node

import { createRequire } from "module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupHandlers } from "./handlers.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const serverInfo = {
  name: "shantycrawl-mcp",
  version,
};

const server = new Server(serverInfo, {
  capabilities: {
    tools: {},
  },
});

setupHandlers(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
