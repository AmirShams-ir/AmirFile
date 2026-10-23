export default async function handler() {
    const configured = {
      database: Boolean(process.env.DATABASE_URL),
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      passwordGate: Boolean(process.env.AMIRFILE_ACCESS_PASSWORD && process.env.AMIRFILE_SESSION_SECRET),
    };
    return new Response(JSON.stringify({ ok: true, service: "amirfile-api", configured }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
}
