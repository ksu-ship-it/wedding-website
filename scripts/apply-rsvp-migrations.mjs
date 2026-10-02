import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

nextEnv.loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED is required to apply RSVP migrations.");
}

const database = neon(connectionString);
const migrationDirectory = resolve(process.cwd(), "database/migrations");
const migrationFiles = readdirSync(migrationDirectory)
  .filter((file) => /^\d+.*\.sql$/i.test(file))
  .sort();

await database`
  CREATE TABLE IF NOT EXISTS rsvp_schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

for (const file of migrationFiles) {
  const applied = await database`
    SELECT name FROM rsvp_schema_migrations WHERE name = ${file} LIMIT 1
  `;
  if (applied.length > 0) {
    console.log(`Already applied: ${file}`);
    continue;
  }

  const source = readFileSync(resolve(migrationDirectory, file), "utf8");
  const statements = source
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  await database.transaction((transaction) => [
    ...statements.map((statement) => transaction.query(statement)),
    transaction`INSERT INTO rsvp_schema_migrations (name) VALUES (${file})`,
  ]);
  console.log(`Applied: ${file}`);
}
