import { authConfigurationError, clearSessionCookie, isAuthenticated, issueSessionToken, newSessionCookie, verifyAccessPassword } from "../lib/server/auth.js";
import { json } from "../lib/server/http.js";

export default {
  async fetch(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();
    if (method === "DELETE") {
      const response = json({ authenticated: false });
      response.headers.set("set-cookie", clearSessionCookie());
      return response;
    }
    const configError = authConfigurationError();
    if (configError) return configError;

    if (method === "GET") return json({ authenticated: await isAuthenticated(request) });
    if (method !== "POST") return json({ error: `Method ${method} is not allowed.` }, 405);

    let body: Record<string, unknown>;
    try {
      const value = await request.json();
      if (!value || typeof value !== "object" || Array.isArray(value)) return json({ error: "Request body must be a JSON object." }, 400);
      body = value as Record<string, unknown>;
    } catch {
      return json({ error: "Request body is not valid JSON." }, 400);
    }
    const password = typeof body.password === "string" ? body.password : "";
    if (!verifyAccessPassword(password)) return json({ error: "Incorrect password." }, 401);
    const token = await issueSessionToken();
    const response = json({ authenticated: true });
    response.headers.set("set-cookie", newSessionCookie(token));
    return response;
  },
};
