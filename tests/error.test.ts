import { startServer, stopServer, send, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // Unknown tool
  const r1 = await callTool("does_not_exist", {});
  assert(r1.isError || r1.error || r1.result?.isError, "unknown tool should error");
  const text1 = r1.result?.content?.[0]?.text ?? r1.error?.message ?? "";
  assert(text1.includes("Unknown tool"), `expected 'Unknown tool', got: ${text1}`);

  // Missing required args — server should still respond without crash
  const r2 = await callTool("scrape", {});
  // scrape requires url, so API call fails — but server shouldn't crash
  assert(r2.result !== undefined, "scrape with no url should respond");

  // Null args — SDK rejects with schema error, but server shouldn't crash
  const r3 = await callTool("scrape", null as any);
  assert(r3.error || r3.result?.isError, "null args should return error, not crash");

  // tool_enable with empty string
  const r4 = await callTool("tool_enable", { tool_name: "" });
  // empty string isn't a valid tool, but server should handle gracefully
  assert(r4.result !== undefined, "empty tool_enable should not crash");

  // tool_disable with empty string
  const r5 = await callTool("tool_disable", { tool_name: "" });
  assert(r5.result !== undefined, "empty tool_disable should not crash");

  // Invalid JSON-like args (just raw string — server should handle)
  const r6 = await callTool("scrape", { url: 123 }); // url should be string, but not crash
  assert(r6.result !== undefined, "wrong arg types should not crash");

  console.log("PASS error.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL error.test.ts:", e.message);
  process.exit(1);
});
