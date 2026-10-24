import { readState } from "../../../lib/server/blob-store.js";
import { requireAuth } from "../../../lib/server/auth.js";
import { ApiError, errorResponse, json } from "../../../lib/server/http.js";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") return json({ error: "Only GET is supported." }, 405);
    const denied = await requireAuth(request);
    if (denied) return denied;
    try {
      const pathParts = new URL(request.url).pathname.split("/").filter(Boolean);
      const id = decodeURIComponent(pathParts[2] || "");
      if (!id || pathParts[pathParts.length - 1] !== "info") throw new ApiError(400, "A file ID is required.");
      const state = await readState();
      const file = state.files.find((entry) => entry.id === id);
      if (!file) throw new ApiError(404, "File not found.");
      return json({ data: {
        type: "Virtual File",
        size: null,
        created_at: file.created_at,
        modified_at: file.modified_at,
        url: file.stream_url,
        mime: "text/uri-list",
      } });
    } catch (error) { return errorResponse(error); }
  },
};
