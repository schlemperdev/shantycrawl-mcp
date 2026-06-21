# src/ — ShantyCrawl MCP Source

## Purpose

TypeScript source for the ShantyCrawl MCP server. Implements the lazy-loading tool architecture using `@modelcontextprotocol/sdk`.

## Ownership

- Source files: `src/`
- Build output: `dist/`
- Entry point: `src/index.ts`

## Local Contracts

### File Map
| File | Responsibility |
|------|---------------|
| `index.ts` | Server bootstrap, transport connect |
| `state.ts` | In-memory `Set<string>` tracking active advanced tools |
| `schemas.ts` | `Tool` definitions for 5 base tools (`scrape`, `crawl`, `search`, `tool_enable`, `tool_disable`) |
| `tools.ts` | Registry of 23 advanced tools with minimal schemas |
| `handlers.ts` | `ListToolsRequestSchema` (conditional) and `CallToolRequestSchema` (state + HTTP routing) |
| `firecrawl.ts` | HTTP routing map + `executeTool()` bridge to `http://localhost:3002` |

### Conventions
- All imports use `.js` extension (NodeNext module resolution)
- Tool names use snake_case: `tool_enable`, `tool_disable`
- `handlers.ts` is thin — delegates HTTP to `firecrawl.ts`
- State mutations (`activateTool`/`deactivateTool`) always followed by `server.sendToolListChanged()`
- `firecrawl.ts` ROUTES table maps each tool to method + path + extractData function

### Tool Inventory

**Base (5, always in ListTools):**
`scrape`, `crawl`, `search`, `tool_enable`, `tool_disable`

**Advanced (23, lazy-loaded via tool_enable):**
`map`, `extract`, `parse`, `check_crawl_status`, `agent`, `agent_status`, `interact`, `interact_stop`, `search_feedback`, `feedback`, `research_search_papers`, `research_inspect_paper`, `research_read_paper`, `research_related_papers`, `research_search_github`, `monitor_create`, `monitor_check`, `monitor_checks`, `monitor_delete`, `monitor_get`, `monitor_list`, `monitor_run`, `monitor_update`

## Work Guidance

- Add new advanced tools: add schema to `tools.ts`, add route to `firecrawl.ts`
- New API base URLs: add constant in `firecrawl.ts`
- Keep descriptions ≤4 words to minimize context tokens
- Only include essential params in schemas — omit niche options

## Verification

- `npm run build` — zero errors
- `npm start` — server starts without crash
- Integration: `tools/list` returns 5 base tools, `tool_enable map` adds it to list, `scrape` returns markdown
