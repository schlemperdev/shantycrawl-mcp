---
name: shantycrawl-mcp
description: "Use tool_enable to activate lazy-loaded Firecrawl tools (map, extract, parse, agent, interact, research, monitor) before calling them."
license: MIT
compatibility: opencode
metadata:
  scope: shantio
  type: workflow
---

## O que faz

Ensina o agente a usar `tool_enable()` para ativar ferramentas avançadas do servidor MCP `shantycrawl-mcp` antes de chamá-las. Esse servidor usa lazy-loading: apenas 6 tools base aparecem em `tools/list` inicialmente; as 22 avançadas precisam ser ativadas explicitamente.

## Quando usar

Ative quando encontrar o servidor `shantycrawl-mcp` nas tools disponíveis, ou quando o usuário pedir algo como:
- "mapeie um site" / "map this site"
- "extraia dados estruturados" / "extract data"
- "parseie um arquivo" / "parse this file"
- "pesquise artigos" / "research papers"
- "monitore uma página" / "monitor this page"
- "interaja com uma página" / "interact with this page"
- "use um agente de pesquisa" / "use research agent"

## Protocolo

### 1. Descubra as ferramentas disponíveis

Chame `tool_enable()` **sem argumentos** para listar todas as 22 ferramentas avançadas com status (ativa/inativa).

### 2. Ative a ferramenta desejada

Chame `tool_enable("map")` para ativar a ferramenta `map`, ou `tool_enable("extract")` para ativar `extract`, etc.

### 3. Use a ferramenta

Após ativação, a ferramenta aparece em `tools/list` e pode ser chamada normalmente.

## Regras

- **Nunca** tente chamar `map`, `extract`, `parse`, `agent`, `interact`, `research_*` ou `monitor_*` sem antes ativá-las via `tool_enable`.
- Se o usuário pedir algo que exija múltiplas ferramentas avançadas, ative todas de uma vez com chamadas sequenciais a `tool_enable`.
- As 6 tools base (`scrape`, `crawl`, `search`, `check_crawl_status`, `tool_enable`, `tool_disable`) estão sempre disponíveis — não precisam de ativação.
- Se não tiver certeza se uma ferramenta está disponível, use `tool_enable()` sem argumentos para verificar.
