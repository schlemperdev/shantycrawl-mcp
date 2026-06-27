import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";

let server: ChildProcess;
let rl: ReturnType<typeof createInterface>;
let idCounter = 0;

export function startServer() {
  server = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });
  rl = createInterface({ input: server.stdout });
}

export function stopServer() {
  server.kill("SIGTERM");
}

export function send(method: string, params: unknown = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++idCounter;
    const req = JSON.stringify({ jsonrpc: "2.0", id, method, params });

    const onLine = (line: string) => {
      try {
        const msg = JSON.parse(line);
        if (msg.id === id) {
          rl.removeListener("line", onLine);
          resolve(msg);
        }
      } catch {
        // ignore partial lines or non-JSON output (e.g. console.error from server)
      }
    };

    rl.on("line", onLine);
    server.stdin.write(req + "\n");

    setTimeout(() => {
      rl.removeListener("line", onLine);
      reject(new Error(`Timeout: id=${id} method=${method}`));
    }, 5000);
  });
}

export function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

export async function callTool(name: string, args: Record<string, unknown> = {}) {
  return send("tools/call", { name, arguments: args });
}
