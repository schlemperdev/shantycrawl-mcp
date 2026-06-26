# ShantyCrawl MCP -- Dynamic Firecrawl MCP Server

## Purpose

Custom MCP server for Firecrawl with lazy-loading tool architecture. Replaces the official `firecrawl-mcp` (28 tools upfront) with 6 base tools (`scrape`, `crawl`, `search`, `check_crawl_status`, `tool_enable`, `tool_disable`) and dynamic activation of advanced tools via `tool_enable`/`tool_disable`. Drastically reduces context consumption.

## Ownership

- Published as `shantycrawl-mcp` on npm.
- Source at `~/projects/shantycrawl-mcp/`.
- Stack: Node.js + TypeScript + `@modelcontextprotocol/sdk`
- Transport: stdio
- API target: `FIRECRAWL_API_URL` env var (default `https://api.firecrawl.dev` if `FIRECRAWL_API_KEY` is set, else `http://localhost:3002`).

## Local Contracts

- Built with `@modelcontextprotocol/sdk`. No FastMCP or other wrappers.
- Communication exclusively via stdio.
- In-memory state tracks which advanced tools are active in the session.
- `tool_enable` adds tool to state and emits `notifications/tools/list_changed`.
- `tool_disable` removes tool from state and emits `notifications/tools/list_changed`.
- Authentication: `FIRECRAWL_API_KEY` env var → `Authorization: Bearer` header on all requests. Never exposed in tool schemas.
- Extraction tools (scrape, crawl, etc.) call Firecrawl API at the configured `FIRECRAWL_API_URL` via HTTP fetch, return formatted Markdown.
- POST/PATCH tools use optional `buildBody` mapper for argument shaping before API call. No mapper = raw args sent unchanged (fallback-safe).

## Work Guidance

- This server lazy-loads 22 advanced tools via `tool_enable`. Only 6 base tools appear in `tools/list` initially. Call `tool_enable("<name>")` to activate `map`, `extract`, `parse`, `agent`, `interact`, `research_*`, or `monitor_*` tools.
- The server also exposes a `shantycrawl-setup` prompt with full usage instructions — fetch it via `GetPromptRequestSchema` when connecting.
- Build output goes to `dist/`. Config reference lives in `~/shantio/dotfiles/opencode/opencode.jsonc`.
- AGENTS.md is the single source of project contracts — update when purpose, scope, or workflow changes.
- To add a tool: register schema in `tools.ts`, add route in `firecrawl.ts`.
- Keep schemas minimal (≤4 word descriptions, only vital params).
- All routes target Firecrawl v2 API. Add `buildBody` to `Route` when API body shape differs from user schema.
- GET tools with query params use `URLSearchParams` in `path` function.
- `scripts/coderabbit-loop.ts` automates CodeRabbit fix loop: polls PR reviews, applies inline suggestions, commits/pushes until green light or MAX_LOOPS (5). Invoke via `tsx scripts/coderabbit-loop.ts <PR_NUMBER> [BRANCH]` after `git-workflow` opens PR. Exit 0 → safe to merge via `git-merge`. Exit 1/2 → manual.

## Verification

- `npm run build` must compile with zero errors
- `npm start` must start without crashing
- Integration: 6 base tools on list, `tool_enable` without args lists available tools, `tool_enable map` activates it, `scrape` returns markdown

---

# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

### Git Workflow (skills: `git-workflow` + `git-merge`)

- **`main` é sagrada** — zero commits diretos, toda mudança começa em branch de feature
- **Agente cria PR e para** — skill `git-workflow`: branch → implementa → commita → push → `gh pr create`. Merge e publicação **não** são feitos pelo agente automaticamente.
- **Merge sob demanda** — skill `git-merge` só roda quando solicitado explicitamente (merge + version + publish)
- **Commits:** Conventional Commits em inglês (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)
- **CI:** `npm run build` zero erros antes de abrir PR

## Child DOX Index

- **`src/AGENTS.md`** — Source code structure, file map, local contracts, and work guidance for the MCP server implementation.
- **`skills/`** — SKILL.md for opencode users on how to use tool_enable with this server.
