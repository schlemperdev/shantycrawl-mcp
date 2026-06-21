#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupHandlers } from "./handlers.js";

const serverInfo = {
  name: "shantycrawl-mcp",
  version: "0.1.0",
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
