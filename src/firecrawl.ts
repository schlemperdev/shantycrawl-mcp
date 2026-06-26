const API_KEY = process.env.FIRECRAWL_API_KEY ?? "";
const DEFAULT_BASE = API_KEY ? "https://api.firecrawl.dev" : "http://localhost:3002";
const API_BASE = process.env.FIRECRAWL_API_URL ?? DEFAULT_BASE;
const TOOL_ENABLE_HINT = "\n\n---\n_Need more? Call tool_enable() to list and activate advanced tools._";

type HttpMethod = "POST" | "GET" | "DELETE" | "PATCH";

interface Route {
  method: HttpMethod;
  path: string | ((args: Record<string, unknown>) => string);
  buildBody?: (args: Record<string, unknown>) => unknown;
  extractData?: (data: unknown) => string;
}

const ROUTES: Record<string, Route> = {
  scrape: {
    method: "POST",
    path: "/v2/scrape",
    buildBody: (args) => ({
      url: args.url,
      ...(args.formats ? { formats: (args.formats as unknown[]).map((f) => (typeof f === "string" ? { type: f } : f)) } : {}),
      ...(args.onlyMainContent !== undefined ? { onlyMainContent: args.onlyMainContent } : {}),
      ...(args.waitFor !== undefined ? { waitFor: args.waitFor } : {}),
    }),
    extractData: (d) => ((d as { markdown?: string })?.markdown ?? "") + TOOL_ENABLE_HINT,
  },
  crawl: {
    method: "POST",
    path: "/v2/crawl",
    buildBody: (args) => ({
      url: args.url,
      ...(args.maxDepth !== undefined ? { maxDepth: args.maxDepth } : {}),
      ...(args.limit !== undefined ? { limit: args.limit } : {}),
    }),
    extractData: (d) => JSON.stringify(d, null, 2) + TOOL_ENABLE_HINT,
  },
  search: {
    method: "POST",
    path: "/v2/search",
    buildBody: (args) => {
      const body: Record<string, unknown> = {};
      if (args.query) body.query = args.query;
      if (args.limit !== undefined) body.limit = args.limit;
      return body;
    },
    extractData: formatSearchResults,
  },
  map: {
    method: "POST",
    path: "/v2/map",
    buildBody: (args) => ({
      url: args.url,
      ...(args.search ? { search: args.search } : {}),
    }),
    extractData: (d) => (d as { links?: string[] })?.links?.join("\n") ?? "",
  },
  extract: {
    method: "POST",
    path: "/v2/extract",
    buildBody: (args) => ({
      urls: args.urls,
      ...(args.prompt ? { prompt: args.prompt } : {}),
    }),
    extractData: (d) => JSON.stringify(d, null, 2),
  },
  parse: {
    method: "POST",
    path: "/v2/parse",
    buildBody: (args) => ({
      filePath: args.filePath,
      ...(args.formats ? { formats: args.formats } : {}),
    }),
    extractData: (d) => (d as { markdown?: string })?.markdown ?? "",
  },
  feedback:      { method: "POST", path: "/v2/feedback",     extractData: (d) => JSON.stringify(d, null, 2) },
  search_feedback: { method: "POST", path: (a) => `/v2/search/${a.searchId}/feedback`, extractData: (d) => JSON.stringify(d, null, 2) },
  check_crawl_status: { method: "GET", path: (a) => `/v2/crawl/${a.id}`, extractData: (d) => serializeCrawlStatus(d) },
  agent: {
    method: "POST",
    path: "/v2/agent",
    buildBody: (args) => ({
      prompt: args.prompt,
      ...(args.urls ? { urls: args.urls } : {}),
    }),
    extractData: (d) => JSON.stringify(d, null, 2),
  },
  agent_status:  { method: "GET",  path: (a) => `/v2/agent/${a.id}`, extractData: (d) => JSON.stringify(d, null, 2) },
  interact: {
    method: "POST",
    path: (a) => `/v2/scrape/${a.scrapeId}/interact`,
    buildBody: (args) => {
      const body: Record<string, unknown> = {};
      if (args.prompt) body.prompt = args.prompt;
      return body;
    },
    extractData: (d) => JSON.stringify(d, null, 2),
  },
  interact_stop: { method: "DELETE", path: (a) => `/v2/scrape/${a.scrapeId}/interact`, extractData: (d) => JSON.stringify(d, null, 2) },
  research_search_papers: {
    method: "GET",
    path: (a) => {
      const params = new URLSearchParams();
      if (a.query) params.set("query", a.query as string);
      if (a.k) params.set("k", String(a.k));
      return `/v2/search/research/papers?${params.toString()}`;
    },
    extractData: (d) => formatPapers(d),
  },
  research_inspect_paper: { method: "GET", path: (a) => `/v2/search/research/papers/${a.paperId}`, extractData: (d) => JSON.stringify(d, null, 2) },
  research_read_paper: {
    method: "GET",
    path: (a) => {
      const params = new URLSearchParams();
      if (a.question) params.set("query", a.question as string);
      const qs = params.toString();
      return `/v2/search/research/papers/${a.paperId}${qs ? `?${qs}` : ""}`;
    },
    extractData: (d) => JSON.stringify(d, null, 2),
  },
  research_related_papers: {
    method: "GET",
    path: (a) => {
      const params = new URLSearchParams();
      if (a.seed_ids) params.set("seed_ids", (a.seed_ids as string[]).join(","));
      if (a.intent) params.set("intent", a.intent as string);
      return `/v2/search/research/papers/similar?${params.toString()}`;
    },
    extractData: (d) => JSON.stringify(d, null, 2),
  },
  research_search_github: {
    method: "GET",
    path: (a) => {
      const params = new URLSearchParams({ query: a.query as string });
      return `/v2/search/research/github?${params.toString()}`;
    },
    extractData: (d) => JSON.stringify(d, null, 2),
  },
  monitor_create: {
    method: "POST",
    path: "/v2/monitor",
    buildBody: (args) => {
      const targets: { url: string }[] = [];
      if (args.page) targets.push({ url: args.page as string });
      if (args.pages) (args.pages as string[]).forEach((u) => targets.push({ url: u }));
      return {
        ...(args.goal ? { goal: args.goal } : {}),
        ...(args.name ? { name: args.name } : {}),
        schedule: args.schedule ? { type: "interval", interval: args.schedule as string } : { type: "daily" },
        targets,
      };
    },
    extractData: (d) => JSON.stringify(d, null, 2),
  },
  monitor_list:    { method: "GET",  path: "/v2/monitor",             extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_get:     { method: "GET",  path: (a) => `/v2/monitor/${a.id}`,           extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_delete:  { method: "DELETE", path: (a) => `/v2/monitor/${a.id}`,         extractData: () => "Monitor deleted." },
  monitor_run:     { method: "POST", path: (a) => `/v2/monitor/${a.id}/run`,       extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_update:  { method: "PATCH", path: (a) => `/v2/monitor/${a.id}`,          extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_checks:  { method: "GET",  path: (a) => `/v2/monitor/${a.id}/checks`,    extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_check:   { method: "GET",  path: (a) => `/v2/monitor/${a.id}/checks/${a.checkId}`, extractData: (d) => JSON.stringify(d, null, 2) },
};

function formatSearchResults(data: unknown): string {
  const web = (data as { web?: Array<{ title: string; url: string; description: string }> })?.web;
  if (!web || web.length === 0) return "No results found." + TOOL_ENABLE_HINT;
  return web.map((r) => `## [${r.title}](${r.url})\n${r.description}`).join("\n\n") + TOOL_ENABLE_HINT;
}
}

function serializeCrawlStatus(data: unknown): string {
  const d = data as { status?: string; completed?: number; total?: number; data?: unknown[] };
  const pages = d.data ?? [];
  const content = pages.map((p: unknown) => (p as { markdown?: string })?.markdown ?? JSON.stringify(p, null, 2)).join("\n\n---\n\n");
  return `Status: ${d.status ?? "unknown"} (${d.completed ?? 0}/${d.total ?? 0})\n\n${content}`;
}

function formatPapers(data: unknown): string {
  const results = (data as { results?: Array<{ title: string; arxivId?: string; abstract?: string }> })?.results;
  if (!results || results.length === 0) return "No papers found.";
  return results.map((p) => `## ${p.title}\nID: ${p.arxivId ?? "N/A"}\n${p.abstract ?? ""}`).join("\n\n");
}

export function hasRoute(toolName: string): boolean {
  return toolName in ROUTES;
}

export async function executeTool(toolName: string, args: Record<string, unknown>): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const route = ROUTES[toolName];
  if (!route) {
    return { content: [{ type: "text", text: `Unknown tool: ${toolName}` }], isError: true };
  }

  const path = typeof route.path === "function" ? route.path(args) : route.path;
  const url = `${API_BASE}${path}`;

  try {
    const headers: Record<string, string> = {};
    if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
    const fetchOptions: RequestInit = { method: route.method, headers };

    if (route.method === "POST" || route.method === "PATCH") {
      (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(route.buildBody ? route.buildBody(args) : args);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      return { content: [{ type: "text", text: `HTTP ${response.status}: ${text}` }], isError: true };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let result: unknown;

    if (contentType.includes("application/json")) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    const jsonResult = result as { success?: boolean; data?: unknown; error?: string };

    if (jsonResult && typeof jsonResult === "object" && "success" in jsonResult && jsonResult.success === false) {
      return { content: [{ type: "text", text: jsonResult.error ?? "Request failed." }], isError: true };
    }

    const data = jsonResult?.data ?? jsonResult;
    const text = route.extractData ? route.extractData(data) : JSON.stringify(data, null, 2);

    return { content: [{ type: "text", text }] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Request failed: ${msg}` }], isError: true };
  }
}
