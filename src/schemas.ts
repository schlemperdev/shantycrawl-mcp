import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const scrapeTool: Tool = {
  name: "scrape",
  description: "Extract markdown from a URL",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Target URL" },
      formats: { type: "array", items: { type: "string" }, description: "Output format(s)" },
      onlyMainContent: { type: "boolean", description: "Main content only" },
      waitFor: { type: "number", description: "JS wait (ms)" },
    },
    required: ["url"],
  },
};

export const crawlTool: Tool = {
  name: "crawl",
  description: "Crawl a website for page content",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Start URL" },
      maxDepth: { type: "number", description: "Max depth" },
      limit: { type: "number", description: "Max pages" },
    },
    required: ["url"],
  },
};

export const searchTool: Tool = {
  name: "search",
  description: "Search the web",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results" },
    },
    required: ["query"],
  },
};

export const toolEnableTool: Tool = {
  name: "tool_enable",
  description: "Activate an advanced tool for this session",
  inputSchema: {
    type: "object",
    properties: {
      tool_name: { type: "string", description: "Tool name" },
    },
    required: ["tool_name"],
  },
};

export const toolDisableTool: Tool = {
  name: "tool_disable",
  description: "Deactivate an advanced tool for this session",
  inputSchema: {
    type: "object",
    properties: {
      tool_name: { type: "string", description: "Tool name" },
    },
    required: ["tool_name"],
  },
};

export const baseTools: Tool[] = [
  scrapeTool,
  crawlTool,
  searchTool,
  toolEnableTool,
  toolDisableTool,
];
