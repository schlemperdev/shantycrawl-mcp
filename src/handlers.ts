import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { baseTools } from "./schemas.js";
import { getAdvancedTool, hasAdvancedTool, getAdvancedToolNames } from "./tools.js";
import { getActiveTools, isToolActive, activateTool, deactivateTool } from "./state.js";
import { executeTool, hasRoute } from "./firecrawl.js";

function isBaseTool(name: string): boolean {
  return baseTools.some(t => t.name === name);
}

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
        const toolName = args?.tool_name as string | undefined;

        if (!toolName) {
          const names = getAdvancedToolNames();
          const lines = names.map(n => {
            const tool = getAdvancedTool(n);
            const status = isToolActive(n) ? "✅ active" : "○ inactive";
            return `  ${n.padEnd(28)} ${status}  — ${tool?.description ?? ""}`;
          });
          return {
            content: [{
              type: "text" as const,
              text: `Available advanced tools:\n${lines.join("\n")}\n\nUse tool_enable("<name>") to activate a tool.`,
            }],
          };
        }

        if (isBaseTool(toolName)) {
          return {
            content: [{ type: "text" as const, text: `Tool '${toolName}' is a base tool and is always available.` }],
            isError: true,
          };
        }

        if (!hasAdvancedTool(toolName)) {
          return {
            content: [{ type: "text" as const, text: `Unknown tool: '${toolName}'. Available: ${getAdvancedToolNames().join(", ")}` }],
            isError: true,
          };
        }

        if (activateTool(toolName)) {
          await server.sendToolListChanged();
        }
        return {
          content: [{ type: "text" as const, text: `Tool '${toolName}' activated.` }],
        };
      }

      case "tool_disable": {
        const toolName = args?.tool_name as string | undefined;

        if (!toolName) {
          const active = getActiveTools();
          if (active.length === 0) {
            return {
              content: [{ type: "text" as const, text: "No advanced tools are currently active. Use tool_enable to see available tools." }],
            };
          }
          return {
            content: [{ type: "text" as const, text: `Active tools:\n  ${active.join("\n  ")}` }],
          };
        }

        if (isBaseTool(toolName)) {
          return {
            content: [{ type: "text" as const, text: `Tool '${toolName}' is a base tool and cannot be disabled.` }],
            isError: true,
          };
        }

        if (!deactivateTool(toolName)) {
          return {
            content: [{ type: "text" as const, text: `Tool '${toolName}' is not active.` }],
            isError: true,
          };
        }

        await server.sendToolListChanged();
        return {
          content: [{ type: "text" as const, text: `Tool '${toolName}' deactivated.` }],
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
