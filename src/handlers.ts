import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { baseTools } from "./schemas.js";
import { getAdvancedTool, hasAdvancedTool } from "./tools.js";
import { getActiveTools, activateTool, deactivateTool } from "./state.js";
import { executeTool, hasRoute } from "./firecrawl.js";

export function setupHandlers(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = [...baseTools];

    for (const name of getActiveTools()) {
      const tool = getAdvancedTool(name);
      if (tool) tools.push(tool);
    }

    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "tool_enable": {
        const toolName = args?.tool_name as string;
        if (!toolName || !hasAdvancedTool(toolName)) {
          return {
            content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
            isError: true,
          };
        }
        if (activateTool(toolName)) {
          await server.sendToolListChanged();
        }
        return {
          content: [{ type: "text", text: `Tool '${toolName}' activated.` }],
        };
      }

      case "tool_disable": {
        const toolName = args?.tool_name as string;
        if (!toolName) {
          return {
            content: [{ type: "text", text: "Missing tool_name argument." }],
            isError: true,
          };
        }
        if (deactivateTool(toolName)) {
          await server.sendToolListChanged();
        }
        return {
          content: [{ type: "text", text: `Tool '${toolName}' deactivated.` }],
        };
      }

      default: {
        if (!hasRoute(name)) {
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
        }
        return executeTool(name, (args ?? {}) as Record<string, unknown>);
      }
    }
  });
}
