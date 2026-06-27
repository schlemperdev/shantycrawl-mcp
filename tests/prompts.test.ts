import { startServer, stopServer, send, assert } from "./helper.js";

async function main() {
  startServer();

  // ListPrompts
  const list = await send("prompts/list", {});
  const prompts = list.result?.prompts ?? [];
  assert(prompts.length === 1, `Expected 1 prompt, got ${prompts.length}`);
  assert(prompts[0].name === "shantycrawl-setup", `Expected shantycrawl-setup, got ${prompts[0]?.name}`);

  // GetPrompt
  const get = await send("prompts/get", { name: "shantycrawl-setup" });
  const messages = get.result?.messages ?? [];
  assert(messages.length > 0, "Expected messages");
  const text = messages.map((m: any) => m.content?.text ?? "").join(" ");
  assert(text.includes("tool_enable"), "setup prompt should mention tool_enable");
  assert(text.includes("scrape"), "setup prompt should mention scrape");
  assert(text.includes("Advanced tool"), "setup prompt should mention advanced tools");

  // Unknown prompt
  const unknown = await send("prompts/get", { name: "nonexistent" });
  assert(unknown.result?.description?.includes("Unknown"), "unknown prompt should return description");

  console.log("PASS prompts.test.ts");
  stopServer();
}

main().catch((e) => {
  console.error("FAIL prompts.test.ts:", e.message);
  process.exit(1);
});
