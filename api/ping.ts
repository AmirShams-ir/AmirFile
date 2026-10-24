export default {
  async fetch(): Promise<Response> {
    const configured = {
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      metadataEncryption: Boolean(process.env.AMIRFILE_SESSION_SECRET),
      passwordGate: Boolean(process.env.AMIRFILE_ACCESS_PASSWORD && process.env.AMIRFILE_SESSION_SECRET),
      databaseRequired: false,
      binaryUploadsEnabled: false,
    };
    return new Response(JSON.stringify({ ok: true, service: "amirfile-api", storage: "encrypted-json-blob", configured }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  },
};
