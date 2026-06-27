import { startServer, stopServer, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // map — implicit activation
  const r1 = await callTool("map", { url: "http://example.com" });
  assert(!r1.result?.isError, `map should succeed: ${JSON.stringify(r1.result?.content?.[0]?.text ?? r1.error ?? "")}`);
  // ponytail: local Firecrawl may return empty link list — just assert no crash

  // After map call, should not be in tools/list
  const list1 = await callTool("tool_disable", {});
  const activeText = list1.result?.content?.[0]?.text ?? "";
  assert(!activeText.includes("map"), "map should not persist after implicit call");

  // Enable map explicitly, call, then check it persists
  await callTool("tool_enable", { tool_name: "map" });
  await callTool("map", { url: "http://example.com" });
  const list2 = await callTool("tool_disable", {});
  assert(list2.result?.content?.[0]?.text?.includes("map"), "map should persist after explicit enable");
  await callTool("tool_disable", { tool_name: "map" });

  // extract — requires urls array, implicit activation
  const r3 = await callTool("extract", { urls: ["http://example.com"], prompt: "list main topics" });
  // extract with prompt needs Firecrawl AI — may error but shouldn't be "unknown"
  assert(!r3.error, `extract should not be unknown: ${JSON.stringify(r3.error ?? "")}`);

  // Agent
  const r4 = await callTool("agent", { prompt: "what is the weather" });
  assert(!r4.error, `agent should not be unknown: ${JSON.stringify(r4.error ?? "")}`);

  // interact with fake scrapeId — should not be unknown
  const r5 = await callTool("interact", { scrapeId: "fake", prompt: "click something" });
  assert(!r5.error, `interact should not be unknown: ${JSON.stringify(r5.error ?? "")}`);

  console.log("PASS advanced.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL advanced.test.ts:", e.message);
  process.exit(1);
});
