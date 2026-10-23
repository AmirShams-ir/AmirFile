import { del } from "@vercel/blob";
import { getDatabase } from "../lib/server/db";
import { requireAuth } from "../lib/server/auth";
import { ApiError, assertMethod, cleanText, errorResponse, json, readJson, validateHttpUrl } from "../lib/server/http";

export default {
  async fetch(request: Request): Promise<Response> {
    const denied = await requireAuth(request);
    if (denied) return denied;
    const methodError = assertMethod(request, ["GET", "POST", "PUT", "DELETE"]);
    if (methodError) return methodError;
    try {
      const sql = await getDatabase();
      if (request.method === "GET") {
        const folderId = new URL(request.url).searchParams.get("folder");
        if (!folderId) throw new ApiError(400, "The folder query parameter is required.");
        const rows = await sql`
          SELECT id, folder_id, name, stream_url, icon, size, mime_type, created_at, modified_at
          FROM files WHERE folder_id = ${folderId} ORDER BY name ASC
        `;
        return json({ data: rows });
      }
      const body = await readJson(request);
      const id = body.id == null ? "" : cleanText(body.id, "File ID");
      if (request.method === "POST") {
        const folderId = cleanText(body.folder_id, "Folder ID");
        const name = cleanText(body.name, "File name");
        const streamUrl = validateHttpUrl(body.stream_url);
        const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "🎬";
        const folder = await sql`SELECT id FROM folders WHERE id = ${folderId} LIMIT 1`;
        if (!folder.length) throw new ApiError(400, "The destination folder does not exist.");
        const fileId = id || crypto.randomUUID();
        const rows = await sql`
          INSERT INTO files (id, folder_id, name, stream_url, icon)
          VALUES (${fileId}, ${folderId}, ${name}, ${streamUrl}, ${icon})
          RETURNING id, folder_id, name, stream_url, icon, created_at, modified_at
        `;
        return json({ data: rows[0] }, 201);
      }
      if (!id) throw new ApiError(400, "File ID is required.");
      if (request.method === "PUT") {
        const found = await sql`SELECT id, folder_id, name, stream_url FROM files WHERE id = ${id} LIMIT 1`;
        if (!found.length) throw new ApiError(404, "File not found.");
        const current = found[0] as { id: string; folder_id: string; name: string; stream_url: string };
        const folderId = body.folder_id === undefined ? current.folder_id : cleanText(body.folder_id, "Folder ID");
        const name = body.name === undefined ? current.name : cleanText(body.name, "File name");
        const streamUrl = body.stream_url === undefined ? current.stream_url : validateHttpUrl(body.stream_url);
        if (folderId !== current.folder_id) {
          const folder = await sql`SELECT id FROM folders WHERE id = ${folderId} LIMIT 1`;
          if (!folder.length) throw new ApiError(400, "The destination folder does not exist.");
        }
        const rows = await sql`
          UPDATE files SET folder_id = ${folderId}, name = ${name}, stream_url = ${streamUrl}, modified_at = NOW()
          WHERE id = ${id}
          RETURNING id, folder_id, name, stream_url, icon, size, mime_type, created_at, modified_at
        `;
        return json({ data: rows[0] });
      }
      const found = await sql`SELECT id, blob_url FROM files WHERE id = ${id} LIMIT 1`;
      if (!found.length) throw new ApiError(404, "File not found.");
      const blobUrl = (found[0] as { blob_url: string | null }).blob_url;
      if (blobUrl) {
        if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("CONFIG_MISSING: Set BLOB_READ_WRITE_TOKEN in Vercel before deleting uploaded files.");
        await del(blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
      await sql`DELETE FROM files WHERE id = ${id}`;
      return json({ ok: true, id });
    } catch (error) { return errorResponse(error); }
  },
};
