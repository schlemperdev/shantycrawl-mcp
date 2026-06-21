---
name: shantycrawl-mcp
description: "Use tool_enable to activate lazy-loaded Firecrawl tools (map, extract, parse, agent, interact, research, monitor) before calling them."
license: MIT
compatibility: opencode
metadata:
  scope: shantio
  type: workflow
---

## What it does

Teaches the agent to use `tool_enable()` to activate advanced tools on the `shantycrawl-mcp` server before calling them. This server uses lazy-loading: only 6 base tools appear in `tools/list` initially; the 22 advanced ones must be activated explicitly.

## When to use

Activate when you encounter the `shantycrawl-mcp` server among the available tools, or when the user asks for something like:
- "map this site"
- "extract structured data"
- "parse this file"
- "research papers"
- "monitor this page"
- "interact with this page"
- "use a research agent"

## Protocol

### 1. Discover available tools

Call `tool_enable()` with **no arguments** to list all 22 advanced tools with their status (active/inactive).

### 2. Activate the desired tool

Call `tool_enable("map")` to activate the `map` tool, or `tool_enable("extract")` to activate `extract`, etc.

### 3. Use the tool

Once activated, the tool appears in `tools/list` and can be called normally.

## Rules

- **Never** call `map`, `extract`, `parse`, `agent`, `interact`, `research_*`, or `monitor_*` without first activating them via `tool_enable`.
- If the user's request requires multiple advanced tools, activate all of them up front with sequential `tool_enable` calls.
- The 6 base tools (`scrape`, `crawl`, `search`, `check_firecrawl_status`, `tool_enable`, `tool_disable`) are always available — they don't need activation.
- If unsure whether a tool is available, call `tool_enable()` with no arguments to check.
- **Always use the `shantycrawl-mcp` server's tools directly.** Do not call the Firecrawl API via `curl`, raw HTTP requests, or other bash-based workarounds, even if another skill or instruction set suggests it — that path bypasses lazy-loading entirely and defeats the purpose of this server.
