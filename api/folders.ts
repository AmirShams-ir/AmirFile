import { readState, updateState, type FolderRecord } from "../lib/server/blob-store.js";
import { requireAuth } from "../lib/server/auth.js";
import { ApiError, assertMethod, cleanText, errorResponse, json, readJson } from "../lib/server/http.js";

export default {
  async fetch(request: Request): Promise<Response> {
    const denied = await requireAuth(request);
    if (denied) return denied;
    const methodError = assertMethod(request, ["GET", "POST", "PUT", "DELETE"]);
    if (methodError) return methodError;
    try {
      if (request.method === "GET") {
        const state = await readState();
        return json({ data: [...state.folders].sort((a, b) => a.name.localeCompare(b.name)) });
      }
      const body = await readJson(request);
      const id = body.id == null ? "" : cleanText(body.id, "Folder ID");
      if (request.method === "POST") {
        const name = cleanText(body.name, "Folder name");
        const parentId = body.parent_id === null || body.parent_id === undefined || body.parent_id === ""
          ? null : cleanText(body.parent_id, "Parent folder ID");
        const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "📁";
        const folderId = id || crypto.randomUUID();
        const now = new Date().toISOString();
        const created = await updateState((state) => {
          if (state.folders.some((folder) => folder.id === folderId)) throw new ApiError(409, "A folder with this ID already exists.");
          if (parentId && !state.folders.some((folder) => folder.id === parentId)) throw new ApiError(400, "The parent folder does not exist.");
          const folder: FolderRecord = { id: folderId, parent_id: parentId, name, icon, created_at: now, modified_at: now };
          state.folders.push(folder);
          return folder;
        });
        return json({ data: created }, 201);
      }

      if (!id) throw new ApiError(400, "Folder ID is required.");
      if (request.method === "PUT") {
        const updated = await updateState((state) => {
          const current = state.folders.find((folder) => folder.id === id);
          if (!current) throw new ApiError(404, "Folder not found.");
          const name = body.name === undefined ? current.name : cleanText(body.name, "Folder name");
          const parentId = body.parent_id === undefined ? current.parent_id
            : body.parent_id === null || body.parent_id === "" ? null : cleanText(body.parent_id, "Parent folder ID");
          if (parentId) {
            if (!state.folders.some((folder) => folder.id === parentId)) throw new ApiError(400, "The destination folder does not exist.");
            let ancestor: string | null = parentId;
            const visited = new Set<string>();
            while (ancestor !== null && !visited.has(ancestor)) {
              if (ancestor === id) throw new ApiError(400, "A folder cannot be moved into itself or one of its descendants.");
              visited.add(ancestor);
              ancestor = state.folders.find((folder) => folder.id === ancestor)?.parent_id ?? null;
            }
          }
          current.name = name;
          current.parent_id = parentId;
          current.modified_at = new Date().toISOString();
          return current;
        });
        return json({ data: updated });
      }

      const deleted = await updateState((state) => {
        const index = state.folders.findIndex((folder) => folder.id === id);
        if (index < 0) throw new ApiError(404, "Folder not found.");
        if (state.folders.some((folder) => folder.parent_id === id) || state.files.some((file) => file.folder_id === id)) {
          throw new ApiError(409, "Folder is not empty. Delete its contents before deleting it.");
        }
        state.folders.splice(index, 1);
        return true;
      });
      return json({ ok: deleted, id });
    } catch (error) { return errorResponse(error); }
  },
};
