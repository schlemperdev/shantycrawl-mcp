import { startServer, stopServer, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // map — implicit activation
Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

In `@tests/advanced.test.ts` around lines 7 - 8, The advanced test for
callTool("map") is coupling implicit activation to a live Firecrawl success
path; update the assertion so it no longer requires a successful map result when
no local instance or credentials are available. Keep the test focused on the
contract for implicit activation by checking that the tool is invoked/selected
correctly in tests/advanced.test.ts, and avoid treating API/request errors from
map as a failure.
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
