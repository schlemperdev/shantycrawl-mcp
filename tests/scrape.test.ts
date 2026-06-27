import { startServer, stopServer, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // Basic scrape
  const r1 = await callTool("scrape", { url: "http://example.com" });
  assert(!r1.result?.isError, `scrape should succeed: ${JSON.stringify(r1.result?.content?.[0]?.text ?? r1.error ?? "")}`);
  const text1 = r1.result?.content?.[0]?.text ?? "";
  assert(text1.includes("Example"), `Expected 'Example' in response, got: ${text1.slice(0, 200)}`);
  assert(text1.includes("tool_enable"), "should include TOOL_ENABLE_HINT");

  // Scrape with formats
  const r2 = await callTool("scrape", { url: "http://example.com", formats: ["markdown"] });
  assert(!r2.result?.isError, "scrape with formats should succeed");
  assert(r2.result?.content?.[0]?.text?.includes("Example"), "scrape with formats should return content");

  // Scrape with waitFor
  const r3 = await callTool("scrape", { url: "http://example.com", waitFor: 100 });
  assert(!r3.result?.isError, "scrape with waitFor should succeed");

  // Invalid URL
  const r4 = await callTool("scrape", { url: "http://invalid.local.test" });
  // Could be error, but server shouldn't crash
  assert(r4.result !== undefined, "invalid URL scrape should respond");

  console.log("PASS scrape.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL scrape.test.ts:", e.message);
  process.exit(1);
});
