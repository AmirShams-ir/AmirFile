import { getDatabase } from "../../../lib/server/db";
import { requireAuth } from "../../../lib/server/auth";
import { ApiError, errorResponse, json } from "../../../lib/server/http";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") return json({ error: "Only GET is supported." }, 405);
    const denied = await requireAuth(request);
    if (denied) return denied;
    try {
      const pathParts = new URL(request.url).pathname.split("/").filter(Boolean);
      const id = decodeURIComponent(pathParts[2] || "");
      if (!id || pathParts[pathParts.length - 1] !== "info") throw new ApiError(400, "A file ID is required.");
      const sql = await getDatabase();
      const rows = await sql`
        SELECT id, name, stream_url, size, mime_type, created_at, modified_at
        FROM files WHERE id = ${id} LIMIT 1
      `;
      if (!rows.length) throw new ApiError(404, "File not found.");
      const file = rows[0] as { id: string; name: string; stream_url: string; size: number|string|null; mime_type: string|null; created_at: string|null; modified_at: string|null };
      return json({ data: {
        type: "File",
        size: file.size === null ? null : Number(file.size),
        created_at: file.created_at,
        modified_at: file.modified_at,
        url: file.stream_url,
        mime: file.mime_type || "application/octet-stream",
      } });
    } catch (error) { return errorResponse(error); }
  },
};
