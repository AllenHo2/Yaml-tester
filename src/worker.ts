const worker = {
  async fetch(_request: Request): Promise<Response> {
    return new Response("OK from Cloudflare Worker", {
      headers: { "content-type": "text/plain" },
    });
  },
};

export default worker;
