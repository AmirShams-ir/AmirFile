import { getDatabase } from "../lib/server/db";
import { requireAuth } from "../lib/server/auth";
import { ApiError, assertMethod, cleanText, errorResponse, json, readJson } from "../lib/server/http";

export default {
  async fetch(request: Request): Promise<Response> {
    const denied = await requireAuth(request);
    if (denied) return denied;
    const methodError = assertMethod(request, ["GET", "POST", "PUT", "DELETE"]);
    if (methodError) return methodError;
    try {
      const sql = await getDatabase();
      if (request.method === "GET") {
        const rows = await sql`SELECT id, parent_id, name, icon, created_at, modified_at FROM folders ORDER BY name ASC`;
        return json({ data: rows });
      }
      const body = await readJson(request);
      const id = body.id == null ? "" : cleanText(body.id, "Folder ID");
      if (request.method === "POST") {
        const name = cleanText(body.name, "Folder name");
        const parentId = body.parent_id === null || body.parent_id === undefined || body.parent_id === ""
          ? null : cleanText(body.parent_id, "Parent folder ID");
        const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "📁";
        if (parentId) {
          const parent = await sql`SELECT id FROM folders WHERE id = ${parentId} LIMIT 1`;
          if (!parent.length) throw new ApiError(400, "The parent folder does not exist.");
        }
        const folderId = id || crypto.randomUUID();
        const rows = await sql`
          INSERT INTO folders (id, parent_id, name, icon) VALUES (${folderId}, ${parentId}, ${name}, ${icon})
          RETURNING id, parent_id, name, icon, created_at, modified_at
        `;
        return json({ data: rows[0] }, 201);
      }
      if (!id) throw new ApiError(400, "Folder ID is required.");
      if (request.method === "PUT") {
        const found = await sql`SELECT id, parent_id, name, icon FROM folders WHERE id = ${id} LIMIT 1`;
        if (!found.length) throw new ApiError(404, "Folder not found.");
        const current = found[0] as { id: string; parent_id: string | null; name: string; icon: string };
        const name = body.name === undefined ? current.name : cleanText(body.name, "Folder name");
        const parentId = body.parent_id === undefined ? current.parent_id
          : body.parent_id === null || body.parent_id === "" ? null : cleanText(body.parent_id, "Parent folder ID");
        if (parentId) {
          const parent = await sql`SELECT id FROM folders WHERE id = ${parentId} LIMIT 1`;
          if (!parent.length) throw new ApiError(400, "The destination folder does not exist.");
          const cycle = await sql`
            WITH RECURSIVE descendants(id) AS (
              SELECT id FROM folders WHERE parent_id = ${id}
              UNION ALL
              SELECT f.id FROM folders f INNER JOIN descendants d ON f.parent_id = d.id
            )
            SELECT id FROM descendants WHERE id = ${parentId} LIMIT 1
          `;
          if (parentId === id || cycle.length) throw new ApiError(400, "A folder cannot be moved into itself or one of its descendants.");
        }
        const rows = await sql`
          UPDATE folders SET name = ${name}, parent_id = ${parentId}, modified_at = NOW()
          WHERE id = ${id} RETURNING id, parent_id, name, icon, created_at, modified_at
        `;
        return json({ data: rows[0] });
      }
      const deleted = await sql`DELETE FROM folders WHERE id = ${id} RETURNING id`;
      if (!deleted.length) throw new ApiError(404, "Folder not found.");
      return json({ ok: true, id });
    } catch (error) { return errorResponse(error); }
  },
};
