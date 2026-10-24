import { get, put } from "@vercel/blob";

export interface FolderRecord {
  id: string;
  parent_id: string | null;
  name: string;
  icon: string;
  created_at: string;
  modified_at: string;
}

export interface FileRecord {
  id: string;
  folder_id: string;
  name: string;
  stream_url: string;
  icon: string;
  size: null;
  mime_type: "text/uri-list";
  created_at: string;
  modified_at: string;
}

export interface AmirFileState {
  version: 1;
  folders: FolderRecord[];
  files: FileRecord[];
}

type LoadedState = { state: AmirFileState; etag: string } | null;
const DATA_PATH = "amirfile/metadata.json";

function assertConfiguration() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("CONFIG_MISSING: Connect a Vercel Blob store to AmirFile and set BLOB_READ_WRITE_TOKEN.");
  }
  if (!process.env.AMIRFILE_SESSION_SECRET) {
    throw new Error("CONFIG_MISSING: Set AMIRFILE_SESSION_SECRET in the Vercel project environment variables.");
  }
}

function emptyState(): AmirFileState {
  return { version: 1, folders: [], files: [] };
}

async function encryptionKey(): Promise<CryptoKey> {
  const secret = process.env.AMIRFILE_SESSION_SECRET;
  if (!secret) throw new Error("CONFIG_MISSING: Set AMIRFILE_SESSION_SECRET in the Vercel project environment variables.");
  const material = new TextEncoder().encode("AmirFile metadata encryption v1\0" + secret);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptState(state: AmirFileState): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cleartext = new TextEncoder().encode(JSON.stringify(state));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), cleartext);
  return JSON.stringify({
    format: "amirfile-encrypted-json-v1",
    iv: Buffer.from(iv).toString("base64"),
    ciphertext: Buffer.from(ciphertext).toString("base64"),
  });
}

async function decryptState(envelopeText: string): Promise<AmirFileState> {
  let envelope: { format?: unknown; iv?: unknown; ciphertext?: unknown };
  try {
    envelope = JSON.parse(envelopeText) as typeof envelope;
  } catch {
    throw new Error("AmirFile metadata Blob is not a valid encrypted JSON envelope.");
  }
  if (envelope.format !== "amirfile-encrypted-json-v1" || typeof envelope.iv !== "string" || typeof envelope.ciphertext !== "string") {
    throw new Error("AmirFile metadata Blob has an unsupported format.");
  }
  const iv = new Uint8Array(Buffer.from(envelope.iv, "base64"));
  const ciphertext = new Uint8Array(Buffer.from(envelope.ciphertext, "base64"));
  if (iv.length !== 12 || ciphertext.length < 16) throw new Error("AmirFile metadata Blob is incomplete.");
  let cleartext: ArrayBuffer;
  try {
    cleartext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await encryptionKey(), ciphertext);
  } catch {
    throw new Error("AmirFile metadata could not be decrypted. Keep AMIRFILE_SESSION_SECRET unchanged; changing it without migrating the Blob key makes existing metadata unreadable.");
  }
  const parsed = JSON.parse(new TextDecoder().decode(cleartext)) as Partial<AmirFileState>;
  if (parsed.version !== 1 || !Array.isArray(parsed.folders) || !Array.isArray(parsed.files)) {
    throw new Error("AmirFile metadata Blob has an invalid data structure.");
  }
  return { version: 1, folders: parsed.folders as FolderRecord[], files: parsed.files as FileRecord[] };
}

async function loadState(): Promise<LoadedState> {
  const result = await get(DATA_PATH, { access: "public", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const contents = await new Response(result.stream).text();
  return { state: await decryptState(contents), etag: result.blob.etag };
}

export async function readState(): Promise<AmirFileState> {
  assertConfiguration();
  const loaded = await loadState();
  return loaded?.state ?? emptyState();
}

export async function updateState<T>(mutate: (state: AmirFileState) => T): Promise<T> {
  assertConfiguration();
  // AmirFile is designed for personal, mostly sequential edits. Use an unconditional
  // overwrite to avoid stale ETag preconditions preventing a normal create/update.
  // Reads bypass the CDN cache so each operation starts from the latest origin copy.
  const loaded = await loadState();
  const state = loaded?.state ?? emptyState();
  const result = mutate(state);
  const encrypted = await encryptState(state);
  try {
    await put(DATA_PATH, encrypted, {
      access: "public",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
  } catch (error) {
    const detail = error instanceof Error ? { name: error.name, message: error.message } : error;
    console.error("[AmirFile Blob write failed]", detail);
    throw error;
  }
  return result;
}
