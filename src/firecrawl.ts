const API_BASE = process.env.FIRECRAWL_API_URL ?? "http://localhost:3002";

type HttpMethod = "POST" | "GET" | "DELETE" | "PATCH";

interface Route {
  method: HttpMethod;
  path: string | ((args: Record<string, unknown>) => string);
  extractData?: (data: unknown) => string;
}

const ROUTES: Record<string, Route> = {
  scrape:        { method: "POST", path: "/v2/scrape",       extractData: (d) => (d as { markdown?: string })?.markdown ?? "" },
  crawl:         { method: "POST", path: "/v1/crawl",        extractData: (d) => JSON.stringify(d, null, 2) },
  search:        { method: "POST", path: "/v2/search",       extractData: formatSearchResults },
  map:           { method: "POST", path: "/v1/map",          extractData: (d) => (d as { links?: string[] })?.links?.join("\n") ?? "" },
  extract:       { method: "POST", path: "/v2/extract",      extractData: (d) => JSON.stringify(d, null, 2) },
  parse:         { method: "POST", path: "/v2/parse",        extractData: (d) => (d as { markdown?: string })?.markdown ?? "" },
  feedback:      { method: "POST", path: "/v2/feedback",     extractData: (d) => JSON.stringify(d, null, 2) },
  search_feedback: { method: "POST", path: "/v2/feedback",   extractData: (d) => JSON.stringify(d, null, 2) },
  check_crawl_status: { method: "GET", path: (a) => `/v1/crawl/${a.id}`, extractData: (d) => serializeCrawlStatus(d) },
  agent:         { method: "POST", path: "/v2/agent",        extractData: (d) => JSON.stringify(d, null, 2) },
  agent_status:  { method: "GET",  path: (a) => `/v2/agent/${a.id}`, extractData: (d) => JSON.stringify(d, null, 2) },
  interact:      { method: "POST", path: (a) => `/v2/browser/${a.scrapeId}/interact`, extractData: (d) => JSON.stringify(d, null, 2) },
  interact_stop: { method: "POST", path: (a) => `/v2/browser/${a.scrapeId}/stop`,     extractData: (d) => JSON.stringify(d, null, 2) },
  research_search_papers:  { method: "POST", path: "/v1/research/papers",    extractData: (d) => formatPapers(d) },
  research_inspect_paper:  { method: "POST", path: "/v1/research/inspect",   extractData: (d) => JSON.stringify(d, null, 2) },
  research_read_paper:     { method: "POST", path: "/v1/research/read",      extractData: (d) => JSON.stringify(d, null, 2) },
  research_related_papers: { method: "POST", path: "/v1/research/related",    extractData: (d) => JSON.stringify(d, null, 2) },
  research_search_github:  { method: "POST", path: "/v1/research/github",    extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_create:  { method: "POST", path: "/v2/monitor",            extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_list:    { method: "GET",  path: "/v2/monitor",             extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_get:     { method: "GET",  path: (a) => `/v2/monitor/${a.id}`,           extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_delete:  { method: "DELETE", path: (a) => `/v1/monitor/${a.id}`,         extractData: () => "Monitor deleted." },
  monitor_run:     { method: "POST", path: (a) => `/v2/monitor/${a.id}/run`,       extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_update:  { method: "PATCH", path: (a) => `/v2/monitor/${a.id}`,          extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_checks:  { method: "GET",  path: (a) => `/v2/monitor/${a.id}/checks`,    extractData: (d) => JSON.stringify(d, null, 2) },
  monitor_check:   { method: "GET",  path: (a) => `/v2/monitor/${a.id}/checks/${a.checkId}`, extractData: (d) => JSON.stringify(d, null, 2) },
};

function formatSearchResults(data: unknown): string {
  const web = (data as { web?: Array<{ title: string; url: string; description: string }> })?.web;
  if (!web || web.length === 0) return "No results found.";
  return web.map((r) => `## [${r.title}](${r.url})\n${r.description}`).join("\n\n");
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
    const fetchOptions: RequestInit = { method: route.method, headers: {} };

    if (route.method === "POST" || route.method === "PATCH") {
      (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(args);
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
