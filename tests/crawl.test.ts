import { startServer, stopServer, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // Start crawl
  const r1 = await callTool("crawl", { url: "http://example.com", limit: 1 });
  assert(!r1.result?.isError, `crawl should succeed: ${JSON.stringify(r1.result?.content?.[0]?.text ?? r1.error ?? "")}`);
  const text1 = r1.result?.content?.[0]?.text ?? "";
  assert(text1.includes("tool_enable"), "should include TOOL_ENABLE_HINT");

  // check_crawl_status with fake ID — should handle gracefully
  const r2 = await callTool("check_crawl_status", { id: "nonexistent-id" });
  assert(r2.result !== undefined, "check_crawl_status with fake ID should respond");

  // Crawl with extra params — local Firecrawl may reject, but server shouldn't crash
  const r3 = await callTool("crawl", { url: "http://example.com", maxDepth: 1, limit: 1 });
  assert(r3.result !== undefined, "crawl with extra params should respond without crash");

  console.log("PASS crawl.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL crawl.test.ts:", e.message);
  process.exit(1);
});
