import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const ADVANCED_TOOLS: Record<string, Tool> = {
  map: {
    name: "map",
    description: "Discover all URLs on a site",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Site URL" },
        search: { type: "string", description: "Filter by search" },
      },
      required: ["url"],
    },
  },

  search_feedback: {
    name: "search_feedback",
    description: "Rate search result quality",
    inputSchema: {
      type: "object",
      properties: {
        searchId: { type: "string", description: "Search job ID" },
        rating: { type: "string", description: "good|bad|partial" },
      },
      required: ["searchId", "rating"],
    },
  },

  feedback: {
    name: "feedback",
    description: "Send feedback on a job result",
    inputSchema: {
      type: "object",
      properties: {
        endpoint: { type: "string", description: "search|scrape|parse|map" },
        jobId: { type: "string", description: "Job ID" },
        rating: { type: "string", description: "good|bad|partial" },
        note: { type: "string", description: "Context note" },
      },
      required: ["endpoint", "jobId", "rating"],
    },
  },

  extract: {
    name: "extract",
    description: "Extract structured data from URLs",
    inputSchema: {
      type: "object",
      properties: {
        urls: { type: "array", items: { type: "string" }, description: "URLs to extract from" },
        prompt: { type: "string", description: "Extraction prompt" },
      },
      required: ["urls"],
    },
  },

  agent: {
    name: "agent",
    description: "Autonomous web research agent",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Research goal" },
        urls: { type: "array", items: { type: "string" }, description: "Seed URLs" },
      },
      required: ["prompt"],
    },
  },

  agent_status: {
    name: "agent_status",
    description: "Check agent job status",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Agent job ID" },
      },
      required: ["id"],
    },
  },

  interact: {
    name: "interact",
    description: "Click/fill/navigate a scraped page",
    inputSchema: {
      type: "object",
      properties: {
        scrapeId: { type: "string", description: "Scrape session ID" },
        prompt: { type: "string", description: "Action description" },
      },
      required: ["scrapeId"],
    },
  },

  interact_stop: {
    name: "interact_stop",
    description: "End an interact session",
    inputSchema: {
      type: "object",
      properties: {
        scrapeId: { type: "string", description: "Scrape session ID" },
      },
      required: ["scrapeId"],
    },
  },

  parse: {
    name: "parse",
    description: "Parse a local file to markdown",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Local file path" },
        formats: { type: "array", items: { type: "string" }, description: "Output format(s)" },
      },
      required: ["filePath"],
    },
  },

  research_inspect_paper: {
    name: "research_inspect_paper",
    description: "Get paper metadata by ID",
    inputSchema: {
      type: "object",
      properties: {
        paperId: { type: "string", description: "arXiv/PMC/DOI ID" },
      },
      required: ["paperId"],
    },
  },

  research_read_paper: {
    name: "research_read_paper",
    description: "Read paper passages by topic",
    inputSchema: {
      type: "object",
      properties: {
        paperId: { type: "string", description: "arXiv/PMC/DOI ID" },
        question: { type: "string", description: "What to find" },
      },
      required: ["paperId", "question"],
    },
  },

  research_related_papers: {
    name: "research_related_papers",
    description: "Find related papers via citations",
    inputSchema: {
      type: "object",
      properties: {
        seed_ids: { type: "array", items: { type: "string" }, description: "Anchor paper IDs" },
        intent: { type: "string", description: "Research angle" },
      },
      required: ["seed_ids", "intent"],
    },
  },

  research_search_github: {
    name: "research_search_github",
    description: "Search GitHub issues and READMEs",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },

  research_search_papers: {
    name: "research_search_papers",
    description: "Search arXiv papers by topic",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Topic description" },
        k: { type: "number", description: "Max results" },
      },
      required: ["query"],
    },
  },

  monitor_check: {
    name: "monitor_check",
    description: "Get page-level diff for a check",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Monitor ID" },
        checkId: { type: "string", description: "Check ID" },
      },
      required: ["id", "checkId"],
    },
  },

  monitor_checks: {
    name: "monitor_checks",
    description: "List historical checks for a monitor",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Monitor ID" },
      },
      required: ["id"],
    },
  },

  monitor_create: {
    name: "monitor_create",
    description: "Create a page change monitor",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "string", description: "URL to watch" },
        pages: { type: "array", items: { type: "string" }, description: "Multiple URLs" },
        goal: { type: "string", description: "What changes matter" },
        name: { type: "string", description: "Monitor name" },
        schedule: { type: "string", description: "Cron or daily time" },
      },
    },
  },

  monitor_delete: {
    name: "monitor_delete",
    description: "Permanently delete a monitor",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Monitor ID" },
      },
      required: ["id"],
    },
  },

  monitor_get: {
    name: "monitor_get",
    description: "Get monitor details by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Monitor ID" },
      },
      required: ["id"],
    },
  },

  monitor_list: {
    name: "monitor_list",
    description: "List all monitors",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results" },
      },
    },
  },

  monitor_run: {
    name: "monitor_run",
    description: "Trigger a monitor check now",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Monitor ID" },
      },
      required: ["id"],
    },
  },

  monitor_update: {
    name: "monitor_update",
    description: "Update a monitor's config",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Monitor ID" },
        body: { type: "object", description: "Fields to patch" },
      },
      required: ["id", "body"],
    },
  },
};

export function getAdvancedTool(name: string): Tool | undefined {
  return ADVANCED_TOOLS[name];
}

export function getAdvancedToolNames(): string[] {
  return Object.keys(ADVANCED_TOOLS);
}

export function hasAdvancedTool(name: string): boolean {
  return name in ADVANCED_TOOLS;
}
