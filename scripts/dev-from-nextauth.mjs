import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function readDotEnvValue(name) {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return undefined;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || match[1] !== name) continue;
    return match[2].replace(/^['"]|['"]$/g, "");
  }

  return undefined;
}

const nextAuthUrl = process.env.NEXTAUTH_URL || readDotEnvValue("NEXTAUTH_URL");
const args = ["dev"];
const nextOutputPath = join(root, ".next");

if (
  existsSync(join(nextOutputPath, "BUILD_ID")) ||
  existsSync(join(nextOutputPath, "required-server-files.json"))
) {
  console.log("Removing production .next output before starting next dev...");
  rmSync(nextOutputPath, { recursive: true, force: true });
}

if (nextAuthUrl) {
  const url = new URL(nextAuthUrl);
  const hostname = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  if (hostname) args.push("--hostname", hostname);
  if (url.port) args.push("--port", url.port);
}

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
