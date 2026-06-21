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
  description: "Activate an advanced tool for this session. Use without arguments to list available tools.",
  inputSchema: {
    type: "object",
    properties: {
      tool_name: { type: "string", description: "Tool name (omit to list available tools)" },
    },
  },
};

export const toolDisableTool: Tool = {
  name: "tool_disable",
  description: "Deactivate an advanced tool for this session. Use without arguments to list currently active tools. See tool_enable for the full list of available tools.",
  inputSchema: {
    type: "object",
    properties: {
      tool_name: { type: "string", description: "Tool name (omit to list active tools)" },
    },
  },
};

export const checkCrawlStatusTool: Tool = {
  name: "check_crawl_status",
  description: "Check crawl job progress",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Crawl job ID" },
    },
    required: ["id"],
  },
};

export const baseTools: Tool[] = [
  scrapeTool,
  crawlTool,
  searchTool,
  checkCrawlStatusTool,
  toolEnableTool,
  toolDisableTool,
];
