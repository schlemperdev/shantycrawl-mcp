import { startServer, stopServer, send, assert } from "./helper.js";

async function main() {
  startServer();

  // ListTools returns 6 base tools
  const list = await send("tools/list", {});
  assert(list.result?.tools?.length === 6, `Expected 6 tools, got ${list.result?.tools?.length}`);

  const names = list.result.tools.map((t: any) => t.name);
  assert(names.includes("scrape"), "Missing scrape");
  assert(names.includes("crawl"), "Missing crawl");
  assert(names.includes("search"), "Missing search");
  assert(names.includes("check_crawl_status"), "Missing check_crawl_status");
  assert(names.includes("tool_enable"), "Missing tool_enable");
  assert(names.includes("tool_disable"), "Missing tool_disable");

  // tool_enable() without args lists advanced tools
  const enableList = await send("tools/call", { name: "tool_enable", arguments: {} });
  assert(enableList.result?.content?.[0]?.text?.includes("map"), "map not in advanced list");
  assert(enableList.result?.content?.[0]?.text?.includes("extract"), "extract not in advanced list");
  assert(enableList.result?.content?.[0]?.text?.includes("inactive"), "should show inactive status");

  // tool_disable() without args when nothing active
  const disableEmpty = await send("tools/call", { name: "tool_disable", arguments: {} });
  assert(disableEmpty.result?.content?.[0]?.text?.includes("No advanced tools"), "should say none active");

  console.log("PASS smoke.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL smoke.test.ts:", e.message);
  process.exit(1);
});
