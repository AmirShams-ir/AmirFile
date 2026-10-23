import { json } from "./http";
const COOKIE_NAME = "amirfile_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
function sessionSecret(): string | null { return process.env.AMIRFILE_SESSION_SECRET || null; }
function cookieValue(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator >= 0 && part.slice(0, separator).trim() === COOKIE_NAME) return part.slice(separator + 1).trim();
  }
  return null;
}
async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function isAuthenticated(request: Request): Promise<boolean> {
  const secret = sessionSecret(), token = cookieValue(request);
  if (!secret || !token) return false;
  const separator = token.indexOf(".");
  if (separator < 1) return false;
  const expires = Number(token.slice(0, separator)), signature = token.slice(separator + 1);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const signatureBytes = new Uint8Array(signature.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
  return crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(String(expires)));
}
export function authConfigurationError(): Response | null {
  if (!process.env.AMIRFILE_ACCESS_PASSWORD || !process.env.AMIRFILE_SESSION_SECRET) {
    return json({ error: "Authentication is not configured. Add AMIRFILE_ACCESS_PASSWORD and AMIRFILE_SESSION_SECRET in Vercel Environment Variables, then redeploy." }, 503);
  }
  return null;
}
export async function requireAuth(request: Request): Promise<Response | null> {
  const configError = authConfigurationError();
  if (configError) return configError;
  if (await isAuthenticated(request)) return null;
  return json({ error: "Authentication required. Unlock AmirFile and retry." }, 401);
}
export function newSessionCookie(token: string, maxAge = SESSION_SECONDS): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export async function issueSessionToken(): Promise<string> {
  const secret = sessionSecret();
  if (!secret) throw new Error("CONFIG_MISSING: Set AMIRFILE_SESSION_SECRET in Vercel Environment Variables.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${expires}.${await sign(String(expires), secret)}`;
}
export function verifyAccessPassword(candidate: string): boolean {
  const expected = process.env.AMIRFILE_ACCESS_PASSWORD || "";
  const a = new TextEncoder().encode(candidate), b = new TextEncoder().encode(expected);
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a[i] || 0) ^ (b[i] || 0);
  return difference === 0;
}
export function clearSessionCookie(): string { return newSessionCookie("", 0); }
