import { startServer, stopServer, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // map — implicit activation
  const r1 = await callTool("map", { url: "http://example.com" });
  const t1 = r1.result?.content?.[0]?.text ?? "";
  assert(!(r1.result?.isError && t1.includes("Unknown tool")),
    `map should not be unknown: ${JSON.stringify(r1)}`);
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
  const t3 = r3.result?.content?.[0]?.text ?? "";
  assert(!(r3.result?.isError && t3.includes("Unknown tool")),
    `extract should not be unknown: ${JSON.stringify(r3)}`);

  // Agent
  const r4 = await callTool("agent", { prompt: "what is the weather" });
  const t4 = r4.result?.content?.[0]?.text ?? "";
  assert(!(r4.result?.isError && t4.includes("Unknown tool")),
    `agent should not be unknown: ${JSON.stringify(r4)}`);

  // interact with fake scrapeId — should not be unknown
  const r5 = await callTool("interact", { scrapeId: "fake", prompt: "click something" });
  const t5 = r5.result?.content?.[0]?.text ?? "";
  assert(!(r5.result?.isError && t5.includes("Unknown tool")),
    `interact should not be unknown: ${JSON.stringify(r5)}`);

  console.log("PASS advanced.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL advanced.test.ts:", e.message);
  process.exit(1);
});
