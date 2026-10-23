import { head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getDatabase } from "../../lib/server/db.js";
import { requireAuth } from "../../lib/server/auth.js";
import { ApiError, errorResponse, json, cleanText } from "../../lib/server/http.js";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "Only POST is supported." }, 405);
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return json({ error: "Set BLOB_READ_WRITE_TOKEN in Vercel Project Settings and connect a Blob store before uploading files." }, 503);
    }
    let body: HandleUploadBody;
    try {
      body = await request.json() as HandleUploadBody;
    } catch {
      return json({ error: "Upload request body is not valid JSON." }, 400);
    }

    // The completion callback is authenticated by Vercel Blob's signed callback flow.
    // Only browser requests that ask for a client upload token need the app session.
    const isCompletion = (body as { type?: string }).type === "blob.upload-completed";
    if (!isCompletion) {
      const denied = await requireAuth(request);
      if (denied) return denied;
    }

    try {
      const output = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          let payload: Record<string, unknown> = {};
          try { payload = clientPayload ? JSON.parse(clientPayload) as Record<string, unknown> : {}; }
          catch { throw new Error("Invalid upload metadata."); }
          const folderId = cleanText(payload.folder_id, "Folder ID");
          const sql = await getDatabase();
          const folder = await sql`SELECT id FROM folders WHERE id = ${folderId} LIMIT 1`;
          if (!folder.length) throw new ApiError(400, "The destination folder does not exist.");
          return {
            allowedContentTypes: ["audio/*", "video/*", "image/*", "text/*", "application/pdf", "application/zip", "application/octet-stream"],
            maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({
              folder_id: folderId,
              original_name: pathname.split("/").pop() || "upload",
            }),
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          let payload: { folder_id?: string; original_name?: string } = {};
          try { payload = tokenPayload ? JSON.parse(tokenPayload) as typeof payload : {}; }
          catch { throw new Error("Upload completed but file metadata could not be decoded."); }
          const folderId = payload.folder_id;
          const originalName = payload.original_name || blob.pathname.split("/").pop() || "Uploaded file";
          if (!folderId) throw new Error("Upload completed without a folder ID.");
          const mime = blob.contentType || "application/octet-stream";
          const icon = mime.startsWith("video/") ? "🎬" : mime.startsWith("audio/") ? "🎵" : mime.startsWith("image/") ? "🖼️" : "📄";
          const sql = await getDatabase();
          const metadata = await head(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
          await sql`
            INSERT INTO files (id, folder_id, name, stream_url, icon, blob_url, blob_pathname, size, mime_type)
            VALUES (${crypto.randomUUID()}, ${folderId}, ${originalName}, ${blob.url}, ${icon}, ${blob.url}, ${blob.pathname}, ${metadata.size}, ${mime})
          `;
        },
      });
      return json(output);
    } catch (error) {
      return errorResponse(error);
    }
  },
};
