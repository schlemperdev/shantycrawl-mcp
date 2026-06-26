<p align="center">
  <img src="assets/avatar.png" alt="ShantyCrawl MCP Mascot" width="240" />
</p>

<h1 align="center">ShantyCrawl MCP</h1>

<h3 align="center">
  <strong>Firecrawl with a chill token footprint. 🦥🔥</strong>
</h3>

<p align="center">
  Drop-in replacement for <code>firecrawl-mcp</code> that loads <strong>6 tools instead of 28</strong> on session start — saving ~18,000 tokens before you've even sent your first message.
</p>

---
<p align="center">
  <a href="https://www.npmjs.com/package/shantycrawl-mcp"><img src="https://img.shields.io/npm/v/shantycrawl-mcp" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/shantycrawl-mcp" alt="MIT license"></a>
  <a href="https://socket.dev/"><img src="https://img.shields.io/badge/Security-Socket.dev-green" alt="Security - Socket.dev"></a>
  <img src="https://img.shields.io/badge/tokens%20saved-~18k%20per%20session-blueviolet" alt="Tokens saved">
  <br>
  <sub><a href="#why-shantycrawl-mcp">Why</a> · <a href="#-quick-start">Quick Start</a> · <a href="#️-configuration">Configuration</a> · <a href="#️-tool-architecture">Tool Architecture</a> · <a href="#-how-dynamic-loading-works">How It Works</a> · <a href="#️-local-development">Local Dev</a> · <a href="#-contributing">Contributing</a> · <a href="#-license">License</a></sub>
</p>
<p align="center">&nbsp;</p>

## Why ShantyCrawl MCP

Most full-featured MCP servers register every tool on every session — including the ones you'll rarely touch — with full JSON schemas re-sent on each tool-list fetch. ShantyCrawl loads **6 core tools** up front and lazy-loads the rest on demand, which measured out to **~18,000 fewer tokens** on a fresh session in our testing:

| | `firecrawl-mcp` (official) | `shantycrawl-mcp` |
| --- | --- | --- |
| Tools on session start | 28 | 6 |
| Initial schema footprint | Full schemas for all 28 tools | Minimal schemas for 6 tools |
| Advanced tools (research, monitoring, agent, etc.) | Always loaded | Loaded on demand via `tool_enable` |
| Measured token cost, fresh session | Baseline | **~18k tokens lighter** |
| Runtime dependencies | — | Zero third-party wrappers, native `fetch` |

### Is This For You?

- ✅ **Good fit** — you use Firecrawl mostly for `scrape`/`crawl`/`search`, run long or multi-tool agent sessions, or are tight on context budget.
- ⚪ **Less critical** — you're already using `tool_enable`-style dynamic loading elsewhere, or you live almost entirely in the monitoring/research toolset and rarely call the core 6 — in that case the savings are smaller, since you'll be loading most of the schema anyway.

<p align="center">&nbsp;</p>

## 🚀 Quick Start

Run instantly via `npx` — no installation required:

```bash
FIRECRAWL_API_URL=http://localhost:3002 npx shantycrawl-mcp
```

**Environment variables:**

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `FIRECRAWL_API_URL` | No | `http://localhost:3002` | URL of your Firecrawl instance (self-hosted or cloud) |
| `FIRECRAWL_API_KEY` | Only for Firecrawl Cloud | — | API key, required if `FIRECRAWL_API_URL` points to a hosted/cloud instance |

**Requirements:** Node.js 18+ and a reachable Firecrawl instance (self-hosted or cloud).

<p align="center">&nbsp;</p>

## ⚙️ Configuration

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shantycrawl": {
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

Add this to your workspace settings:

```json
{
  "mcp": {
    "shantycrawl": {
      "type": "local",
      "command": ["npx", "shantycrawl-mcp"],
      "environment": {
        "FIRECRAWL_API_URL": "http://localhost:3002"
      }
    }
  }
}
```

<p align="center">&nbsp;</p>

## 🛠️ Tool Architecture

### Always Available (6 Core Tools)

| Tool | Description |
| --- | --- |
| `scrape` | Extract clean markdown from any URL |
| `crawl` | Crawl a target website recursively |
| `search` | Execute web searches via Firecrawl |
| `tool_enable` | Dynamically inject an advanced tool into the active session |
| `tool_disable` | Unload an advanced tool to free up context |
| `check_crawl_status` | Check the status of an async `crawl` job |

### Lazy-Loaded Tools (22 Advanced)

Activate any tool instantly during a session — e.g. `tool_enable map` unblocks the mapping capability.

| Category | Tools |
| --- | --- |
| Discovery | `map`, `extract`, `parse` |
| AI Agent | `agent`, `agent_status` |
| Browser Interaction | `interact`, `interact_stop` |
| Research & Academic | `research_search_papers`, `research_inspect_paper`, `research_read_paper`, `research_related_papers`, `research_search_github` |
| Monitoring | `monitor_create`, `monitor_check`, `monitor_checks`, `monitor_delete`, `monitor_get`, `monitor_list`, `monitor_run`, `monitor_update` |
| Feedback | `search_feedback`, `feedback` |

<p align="center">&nbsp;</p>

## 🧠 How Dynamic Loading Works

1. The client sees a minimal 6-tool schema on connect.
2. When the AI needs an advanced capability, it calls `tool_enable <tool_name>`.
3. The server fires a `notifications/tools/list_changed` event, and the client's available tools update instantly — no reconnect required.
4. Call `tool_disable <tool_name>` once you're done to free the context back up.

### ⚠️ Known Issues

**Some agents don't call `tool_enable` on their own.** A compelling tool description isn't always enough — if another skill or system prompt has already taught the agent a different path to the same outcome (e.g. calling the Firecrawl API directly via `curl`/raw HTTP), it can follow that instead of discovering `tool_enable`. This shows up most with coding agents that have built-in or third-party Firecrawl skills already loaded.

**Fix:** add an explicit instruction to your agent's system prompt or AGENTS.md/CLAUDE.md:

```
This project uses the shantycrawl-mcp server. Advanced tools (map, extract, parse,
agent, interact, research_*, monitor_*) are not available until activated with
tool_enable("<tool_name>"). Always use the MCP server's tools directly — never call
the Firecrawl API via curl, raw HTTP, or other bash-based workarounds.
```

We also ship a ready-made [SKILL.md](skills/shantycrawl-mcp/SKILL.md) that encodes this protocol — drop it into your skills directory if your agent supports skill loading, and pair it with the snippet above for the strongest guarantee.

<p align="center">&nbsp;</p>

## 🏗️ Local Development

```bash
git clone https://github.com/schlemperdev/shantycrawl-mcp.git
cd shantycrawl-mcp
npm install
npm run build
npm start
```

## 🤝 Contributing

Issues and PRs are welcome. If you're adding a new lazy-loaded tool, please keep its schema as lean as the core 6 — that's the whole point of this project.

## 📄 License

MIT © [schlemperdev](https://github.com/schlemperdev)
