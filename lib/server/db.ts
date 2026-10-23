import { neon } from "@neondatabase/serverless";

type Sql = (strings: TemplateStringsArray, ...values: any[]) => Promise<Record<string, any>[]>;
let schemaReady: Promise<void> | undefined;

export async function getDatabase(): Promise<Sql> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("CONFIG_MISSING: Set DATABASE_URL in the AmirFile Vercel project's Environment Variables to connect a Neon PostgreSQL database.");
  }

  const sql = neon(connectionString) as unknown as Sql;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        parent_id TEXT NULL REFERENCES folders(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '📁',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id)`;
      await sql`CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        stream_url TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '🎬',
        blob_url TEXT NULL,
        blob_pathname TEXT NULL,
        size BIGINT NULL,
        mime_type TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS files_folder_id_idx ON files(folder_id)`;
      await sql`CREATE INDEX IF NOT EXISTS files_modified_at_idx ON files(modified_at DESC)`;
    })().catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
  return sql;
}
