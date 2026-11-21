import { execFileSync } from "node:child_process";

/** Brings the test database to the latest migration and seeds the template catalogue. */
export default function setup() {
  const url = process.env.INVITOVERSE_TEST_DATABASE_URL;
  if (!url || !/test/i.test(url))
    throw new Error(`Refusing to run integration tests against ${url ?? "(unset)"}`);
  const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url };
  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], { env, stdio: "pipe" });
  execFileSync("pnpm", ["exec", "tsx", "prisma/seed.ts"], { env, stdio: "pipe" });
}
