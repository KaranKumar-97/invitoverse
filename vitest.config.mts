import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/** Minimal .env reader (process.env wins). */
function readEnv(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const file of [".env", ".env.test"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) out[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  }
  return { ...out, ...process.env };
}

const env = readEnv();
// Integration tests use a separate database. Default: same server as DATABASE_URL, db "vivah_test".
const devDb = env.DATABASE_URL ?? "";
const testDb = env.TEST_DATABASE_URL ?? devDb.replace(/\/([^/?]+)(\?|$)/, "/vivah_test$2");
if (testDb && testDb === devDb) {
  throw new Error(
    "TEST_DATABASE_URL must differ from DATABASE_URL — integration tests truncate tables.",
  );
}
// Read by tests/integration/global-setup.ts (runs in this process, before workers start).
process.env.INVITOVERSE_TEST_DATABASE_URL = testDb;

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  // Template CSS is irrelevant to tests; skip the Tailwind PostCSS pipeline.
  css: { postcss: { plugins: [] } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/unit/**/*.test.{ts,tsx}", "tests/templates/**/*.test.{ts,tsx}"],
          server: { deps: { inline: ["next-auth"] } },
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          setupFiles: ["./tests/integration/setup.ts"],
          globalSetup: ["./tests/integration/global-setup.ts"],
          include: ["tests/integration/**/*.test.ts"],
          env: {
            DATABASE_URL: testDb,
            DATABASE_URL_UNPOOLED: testDb,
            LAUNCH_ALL_FREE: "true",
            MEDIA_PROVIDER: "local",
            AUTH_SECRET: "test-secret-for-integration-tests",
          },
          fileParallelism: false,
        },
      },
    ],
  },
});
