import { spawnSync } from "node:child_process";

const testUrl = process.env.TEST_DATABASE_URL;
const productionUrl = process.env.DATABASE_URL;

if (!testUrl) {
  console.error("TEST_DATABASE_URL is required for integration tests.");
  process.exit(1);
}
if (testUrl === productionUrl || testUrl === process.env.PRODUCTION_DATABASE_URL) {
  console.error("Refusing to run integration tests against the production database.");
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: testUrl };
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const push = spawnSync(npx, ["prisma", "db", "push", "--skip-generate"], { env, stdio: "inherit" });
if (push.status !== 0) process.exit(push.status || 1);

const tests = spawnSync(npx, ["tsx", "--test", "tests/integration/*.test.ts"], { env, stdio: "inherit", shell: process.platform === "win32" });
process.exit(tests.status || 0);
