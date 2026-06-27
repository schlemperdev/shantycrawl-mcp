import { startServer, stopServer, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // Basic search
  const r1 = await callTool("search", { query: "test search" });
  assert(!r1.result?.isError, `search should succeed: ${JSON.stringify(r1.result?.content?.[0]?.text ?? r1.error ?? "")}`);
  const text1 = r1.result?.content?.[0]?.text ?? "";
  assert(text1.includes("tool_enable"), "should include TOOL_ENABLE_HINT");

  // Search with limit
  const r2 = await callTool("search", { query: "typescript", limit: 3 });
  assert(!r2.result?.isError, "search with limit should succeed");

  // Search with empty query — server should handle gracefully
  const r3 = await callTool("search", { query: "" });
  assert(r3.result !== undefined, "empty query search should respond");

  console.log("PASS search.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL search.test.ts:", e.message);
  process.exit(1);
});
