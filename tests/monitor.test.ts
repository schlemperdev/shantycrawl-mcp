import { startServer, stopServer, callTool, assert } from "./helper.js";

async function main() {
  startServer();

  // monitor_create — test body format is correct (no BAD_REQUEST). Backend 500 is Firecrawl infra issue.
  const r1 = await callTool("monitor_create", { page: "http://example.com", name: "test-monitor" });
   const r1 = await callTool("monitor_create", { page: "http://example.com", name: "test-monitor" });
-  assert(r1.result !== undefined, "create monitor should respond without crash");
   const text1 = r1.result?.content?.[0]?.text ?? "";
+  assert(r1.result !== undefined && !r1.result?.isError, `monitor_create should succeed: ${text1}`);
   assert(!text1.includes("BAD_REQUEST"), `body format rejected: ${text1.substring(0, 100)}`);
   assert(!text1.includes("Unrecognized key"), `body format rejected: ${text1.substring(0, 100)}`);
@@
-  if (monitorId) {
+  assert(monitorId, `monitor_create did not return an id: ${text1}`);
+  if (monitorId) {
@@
-  } else {
-    console.log("  ⚠ Could not extract monitor ID, skipping dependent tests");
   }
  // Parse monitor ID from response for subsequent tests
  let monitorId = "";
  try {
    const parsed = JSON.parse(text1);
    monitorId = parsed.id ?? parsed.data?.id ?? "";
  } catch {
    // If response isn't JSON, try extracting ID from text
    monitorId = text1.match(/[a-f0-9-]{36}/)?.[0] ?? "";
  }

  if (monitorId) {
    // monitor_get
    const r2 = await callTool("monitor_get", { id: monitorId });
    assert(!r2.result?.isError, "monitor_get should succeed");

    // monitor_update — tests the buildBody fix (RISCO #2)
    const r3 = await callTool("monitor_update", { id: monitorId, body: { name: "updated-monitor" } });
    assert(!r3.result?.isError, "monitor_update should succeed");

    // monitor_list
    const r4 = await callTool("monitor_list", {});
    assert(!r4.result?.isError, "monitor_list should succeed");

    // monitor_checks
    const r5 = await callTool("monitor_checks", { id: monitorId });
    assert(!r5.result?.isError, "monitor_checks should succeed");

    // monitor_run
    const r6 = await callTool("monitor_run", { id: monitorId });
    assert(!r6.result?.isError, "monitor_run should succeed");

    // monitor_delete
    const r7 = await callTool("monitor_delete", { id: monitorId });
    assert(!r7.result?.isError, "monitor_delete should succeed");
  } else {
    console.log("  ⚠ Could not extract monitor ID, skipping dependent tests");
  }

  console.log("PASS monitor.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL monitor.test.ts:", e.message);
  process.exit(1);
});
