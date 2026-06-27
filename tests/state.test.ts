import { startServer, stopServer, send, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // Enable map
  const r1 = await callTool("tool_enable", { tool_name: "map" });
  assert(r1.result?.content?.[0]?.text === "Tool 'map' activated.", "enable map failed");

  // ListTools now has 7
  const list1 = await send("tools/list", {});
  const names1 = list1.result.tools.map((t: any) => t.name);
  assert(names1.includes("map"), "map not in list after enable");
  assert(list1.result.tools.length === 7, `Expected 7, got ${list1.result.tools.length}`);

  // Enable same tool again — no-op (not error, just returns false from activateTool)
  const r2 = await callTool("tool_enable", { tool_name: "map" });
  assert(r2.result?.content?.[0]?.text === "Tool 'map' activated.", "re-enable should return activated");

  // Disable
  const r3 = await callTool("tool_disable", { tool_name: "map" });
  assert(r3.result?.content?.[0]?.text === "Tool 'map' deactivated.", "disable map failed");

  const list2 = await send("tools/list", {});
  assert(list2.result.tools.length === 6, `Expected 6 after disable, got ${list2.result.tools.length}`);

  // Disable again — error
  const r4 = await callTool("tool_disable", { tool_name: "map" });
  assert(r4.isError || r4.error || r4.result?.isError, "double disable should error");

  // Unknown tool
  const r5 = await callTool("tool_enable", { tool_name: "nonexistent" });
  assert(r5.isError || r5.error || r5.result?.isError, "unknown tool should error");

  // Base tool cannot be disabled
  const r6 = await callTool("tool_disable", { tool_name: "scrape" });
  assert(r6.isError || r6.error || r6.result?.isError, "base tool disable should error");

  // tool_disable() without args lists active
  await callTool("tool_enable", { tool_name: "extract" });
  const r7 = await callTool("tool_disable", { arguments: {} });
  assert(r7.result?.content?.[0]?.text?.includes("extract"), "disable list missing extract");

  console.log("PASS state.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL state.test.ts:", e.message);
  process.exit(1);
});
