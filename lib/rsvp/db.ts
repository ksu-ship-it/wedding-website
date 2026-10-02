import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type RsvpDatabaseClient = NeonQueryFunction<false, false>;

const databaseUrl = process.env.DATABASE_URL;

export function getDatabaseUrl(): string | undefined {
  return databaseUrl;
}

export function getDatabaseClient(): RsvpDatabaseClient | null {
  if (!databaseUrl) {
    return null;
  }

  return neon(databaseUrl) as RsvpDatabaseClient;
}

export function requireDatabaseClient(): RsvpDatabaseClient {
  const client = getDatabaseClient();
  if (!client) {
    throw new Error("DATABASE_URL is not configured for the RSVP database.");
  }

  return client;
}

export const database = getDatabaseClient();
