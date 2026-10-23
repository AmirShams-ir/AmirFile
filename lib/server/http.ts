export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.name = "ApiError"; this.status = status; }
}
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "Request body must be a JSON object.");
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Request body is not valid JSON.");
  }
}
export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  const message = error instanceof Error ? error.message : "Unknown server error.";
  console.error("[AmirFile API]", error);
  if (message.startsWith("CONFIG_MISSING:")) return json({ error: message.slice("CONFIG_MISSING:".length).trim() }, 503);
  if (message.startsWith("INVALID_REQUEST:")) return json({ error: message.slice("INVALID_REQUEST:".length).trim() }, 400);
  return json({ error: "The API request failed. Check the AmirFile Vercel function logs." }, 500);
}
export function assertMethod(request: Request, allowed: string[]): Response | null {
  return allowed.includes(request.method.toUpperCase()) ? null : json({ error: `Method ${request.method} is not allowed.` }, 405);
}
export function cleanText(value: unknown, label: string, maxLength = 255): string {
  if (typeof value !== "string" || !value.trim()) throw new ApiError(400, `${label} is required.`);
  const result = value.trim();
  if (result.length > maxLength) throw new ApiError(400, `${label} must be ${maxLength} characters or fewer.`);
  return result;
}
export function validateHttpUrl(value: unknown): string {
  const urlText = cleanText(value, "URL", 4096);
  try {
    const url = new URL(urlText);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported scheme");
    return url.toString();
  } catch {
    throw new ApiError(400, "URL must be a valid HTTP or HTTPS address.");
  }
}
