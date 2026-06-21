<p align="center">
  <img src="assets/avatar.png" alt="ShantyCrawl MCP Mascot" width="220" />
</p>

<h1 align="center">ShantyCrawl MCP</h1>

<p align="center">
  <strong>Firecrawl with a chill token footprint. 🦥🔥</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/shantycrawl-mcp"><img src="https://img.shields.io/npm/v/shantycrawl-mcp" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/shantycrawl-mcp" alt="MIT license"></a>
  <a href="https://socket.dev/"><img src="https://img.shields.io/badge/Security-Socket.dev-green" alt="Security - Socket.dev"></a>
</p>

---

A lean, high-performance MCP server for Firecrawl engineered with a **lazy-loading tool architecture**. 

Replaces the official `firecrawl-mcp` (which forces 28 tools into every session) with just **5 core tools**. Advanced capabilities are injected on-demand, saving thousands of context tokens in your AI coding sessions.

## 🔥 Key Features

* **Context-Aware Design:** Minimizes the initial LLM tool-list overhead by ~80%.
* **Dynamic Tool Injection:** Activates advanced features mid-session via `tool_enable`.
* **Zero Bloat:** Pure `@modelcontextprotocol/sdk` implementation with zero third-party runtime wrappers.
* **Native Speed:** Built with native `fetch` bridging directly to your Firecrawl instance.

## 🚀 Quick Start

Run instantly via `npx` (no installation required):

```bash
FIRECRAWL_API_URL=http://localhost:3002 npx shantycrawl-mcp

```

*Note: Defaults to `http://localhost:3002` if `FIRECRAWL_API_URL` is not provided.*

## 🛠️ Tool Architecture

### 1. Always Available (5 Core Tools)

| Tool | Description |
| --- | --- |
| `scrape` | Extract clean markdown from any URL |
| `crawl` | Crawl a target website recursively |
| `search` | Execute web searches via Firecrawl |
| `tool_enable` | Dynamically inject an advanced tool into the active session |
| `tool_disable` | Unload an advanced tool to free up LLM context |

### 2. Lazy-Loaded Tools (23 Advanced)

Activate any tool instantly during a chat session. Example: `tool_enable map` unblocks the mapping capability.

* **Discovery:** `map`, `extract`, `parse`, `check_crawl_status`
* **AI Agent:** `agent`, `agent_status`
* **Browser Interaction:** `interact`, `interact_stop`
* **Research & Academic:** `research_search_papers`, `research_inspect_paper`, `research_read_paper`, `research_related_papers`, `research_search_github`
* **Monitoring:** `monitor_create`, `monitor_check`, `monitor_checks`, `monitor_delete`, `monitor_get`, `monitor_list`, `monitor_run`, `monitor_update`
* **Feedback:** `search_feedback`, `feedback`

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

## 🧠 Why shantycrawl-mcp?

The official adapter registers all 28 tools upfront. Every time the LLM requests the tool list, it processes verbose JSON schemas full of edge-case parameters, draining your token tier and degrading the AI's reasoning capabilities over long sessions.

**shantycrawl-mcp** introduces a dynamic orchestration pattern:

1. The client sees a minimalist 5-tool schema.
2. When the AI needs an advanced action, it runs `tool_enable <tool_name>`.
3. The server fires a `notifications/tools/list_changed` event, updating the client's capabilities instantly.

## 🛠️ Local Development

```bash
git clone [https://github.com/schlemperdev/shantycrawl-mcp.git](https://github.com/schlemperdev/shantycrawl-mcp.git)
cd shantycrawl-mcp
npm install
npm run build
npm start

```

## 📄 License

MIT © [schlemperdev](https://www.google.com/search?q=https://github.com/schlemperdev)

