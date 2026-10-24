import { readState, updateState, type FileRecord } from "../lib/server/blob-store.js";
import { requireAuth } from "../lib/server/auth.js";
import { ApiError, assertMethod, cleanText, errorResponse, json, readJson, validateHttpUrl } from "../lib/server/http.js";

export default {
  async fetch(request: Request): Promise<Response> {
    const denied = await requireAuth(request);
    if (denied) return denied;
    const methodError = assertMethod(request, ["GET", "POST", "PUT", "DELETE"]);
    if (methodError) return methodError;
    try {
      if (request.method === "GET") {
        const folderId = new URL(request.url).searchParams.get("folder");
        if (!folderId) throw new ApiError(400, "The folder query parameter is required.");
        const state = await readState();
        const files = state.files.filter((file) => file.folder_id === folderId).sort((a, b) => a.name.localeCompare(b.name));
        return json({ data: files });
      }

      const body = await readJson(request);
      const id = body.id == null ? "" : cleanText(body.id, "File ID");
      if (request.method === "POST") {
        const folderId = cleanText(body.folder_id, "Folder ID");
        const name = cleanText(body.name, "File name");
        const streamUrl = validateHttpUrl(body.stream_url);
        const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "🔗";
        const fileId = id || crypto.randomUUID();
        const now = new Date().toISOString();
        const created = await updateState((state) => {
          if (state.files.some((file) => file.id === fileId)) throw new ApiError(409, "A file with this ID already exists.");
          if (!state.folders.some((folder) => folder.id === folderId)) throw new ApiError(400, "The destination folder does not exist.");
          const file: FileRecord = {
            id: fileId, folder_id: folderId, name, stream_url: streamUrl, icon,
            size: null, mime_type: "text/uri-list", created_at: now, modified_at: now,
          };
          state.files.push(file);
          return file;
        });
        return json({ data: created }, 201);
      }

      if (!id) throw new ApiError(400, "File ID is required.");
      if (request.method === "PUT") {
        const updated = await updateState((state) => {
          const current = state.files.find((file) => file.id === id);
          if (!current) throw new ApiError(404, "File not found.");
          const folderId = body.folder_id === undefined ? current.folder_id : cleanText(body.folder_id, "Folder ID");
          const name = body.name === undefined ? current.name : cleanText(body.name, "File name");
          const streamUrl = body.stream_url === undefined ? current.stream_url : validateHttpUrl(body.stream_url);
          if (folderId !== current.folder_id && !state.folders.some((folder) => folder.id === folderId)) {
            throw new ApiError(400, "The destination folder does not exist.");
          }
          current.folder_id = folderId;
          current.name = name;
          current.stream_url = streamUrl;
          current.modified_at = new Date().toISOString();
          return current;
        });
        return json({ data: updated });
      }

      const deleted = await updateState((state) => {
        const index = state.files.findIndex((file) => file.id === id);
        if (index < 0) throw new ApiError(404, "File not found.");
        state.files.splice(index, 1);
        return true;
      });
      return json({ ok: deleted, id });
    } catch (error) { return errorResponse(error); }
  },
};
