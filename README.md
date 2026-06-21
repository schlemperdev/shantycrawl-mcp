# shantycrawl-mcp

[![npm version](https://img.shields.io/npm/v/shantycrawl-mcp)](https://www.npmjs.com/package/shantycrawl-mcp)
[![MIT license](https://img.shields.io/npm/l/shantycrawl-mcp)](LICENSE)

**A lean MCP server for Firecrawl with lazy-loading tool architecture.**

Replaces the official `firecrawl-mcp` (28 tools loaded upfront) with just **5 base tools** always visible — advanced tools load **only when you enable them** via `tool_enable`. Drastically reduces context consumption in AI coding sessions.

## Quick Start

```bash
# Run directly with npx — no install needed
FIRECRAWL_API_URL=http://localhost:3002 npx shantycrawl-mcp
```

Point `FIRECRAWL_API_URL` at your own Firecrawl instance (Docker, cloud, or self-hosted). Defaults to `http://localhost:3002`.

## Tools

### Always Available (5)

| Tool | Description |
|------|-------------|
| `scrape` | Extract markdown from a URL |
| `crawl` | Crawl a website for page content |
| `search` | Search the web |
| `tool_enable` | Load an advanced tool into the session |
| `tool_disable` | Unload an advanced tool from the session |

### Lazy-Loaded via `tool_enable` (23)

`tool_enable map` adds `map` to your tool list for the session. Works for any of:

**Discovery:** `map`, `extract`, `parse`, `check_crawl_status`

**AI Agent:** `agent`, `agent_status`

**Browser Interaction:** `interact`, `interact_stop`

**Feedback:** `search_feedback`, `feedback`

**Research (arXiv):** `research_search_papers`, `research_inspect_paper`, `research_read_paper`, `research_related_papers`, `research_search_github`

**Monitoring:** `monitor_create`, `monitor_check`, `monitor_checks`, `monitor_delete`, `monitor_get`, `monitor_list`, `monitor_run`, `monitor_update`

## Configuration

### Claude Desktop

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["shantycrawl-mcp"],
      "env": {
        "FIRECRAWL_API_URL": "http://localhost:3002"
      }
    }
  }
}
```

### OpenCode

```json
{
  "mcp": {
    "firecrawl": {
      "type": "local",
      "command": ["npx", "shantycrawl-mcp"],
      "environment": {
        "FIRECRAWL_API_URL": "http://localhost:3002"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FIRECRAWL_API_URL` | `http://localhost:3002` | Your Firecrawl API base URL |

## Why shantycrawl-mcp?

The official `firecrawl-mcp` registers all 28 tool schemas upfront in every `tools/list` response. Each schema carries verbose descriptions and niche parameters. Over a session, this burns significant context tokens.

**shantycrawl-mcp** solves this with a simple pattern:

1. By default, only 5 essential tools appear — minimal schemas, minimal tokens.
2. Run `tool_enable <name>` to activate any advanced tool for the session.
3. The server emits `notifications/tools/list_changed`, and the client sees only what you need.

## Development

```bash
git clone https://github.com/shanty/shantycrawl-mcp.git
cd shantycrawl-mcp
npm install
npm run build
npm start
```

## Architecture

- **Stdio transport** — pure `@modelcontextprotocol/sdk`, no FastMCP
- **In-memory state** — tracks active tools per session
- **HTTP bridge** — calls your Firecrawl API via native `fetch`
- **Zero runtime dependencies** beyond the MCP SDK

## License

MIT
