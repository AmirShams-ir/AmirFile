export default async function handler() {
  return new Response(JSON.stringify({ ok: true, service: "amirfile-api", message: "API function is available; storage routes are being integrated." }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}