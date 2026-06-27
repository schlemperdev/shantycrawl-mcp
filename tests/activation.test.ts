import { startServer, stopServer, send, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // map should auto-activate when called without tool_enable
  const r1 = await callTool("map", { url: "http://example.com" });
  const t1 = r1.result?.content?.[0]?.text ?? "";
  assert(!(r1.result?.isError && t1.includes("Unknown tool")),
    `map should not be unknown: ${JSON.stringify(r1)}`);

  // After call, tool should NOT be in active list
  const disableList = await callTool("tool_disable", {});
  assert(!disableList.result?.content?.[0]?.text?.includes("map"),
    "map should not persist after implicit call");

  // Tools/list still shows 6 base tools
  const list = await send("tools/list", {});
  const names = list.result.tools.map((t: any) => t.name);
  assert(!names.includes("map"), "map should not be in tools/list after implicit call");
  assert(list.result.tools.length === 6, `Expected 6, got ${list.result.tools.length}`);

  // Explicit enable + call = tool persists
  await callTool("tool_enable", { tool_name: "map" });
  await callTool("map", { url: "http://example.com" });

  const list2 = await send("tools/list", {});
  assert(list2.result.tools.length === 7, `Expected 7 after explicit enable+call, got ${list2.result.tools.length}`);

  // Disable to clean up
  await callTool("tool_disable", { tool_name: "map" });

  console.log("PASS activation.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL activation.test.ts:", e.message);
  process.exit(1);
});
