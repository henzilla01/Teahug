// Teahug-api Worker (module worker syntax)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, ""); // remove trailing slash
    // We'll expose:
    // GET  /api/songs        -> list songs (JSON)
    // POST /api/songs        -> add a song (JSON body: { title, artist, songURL, coverURL, timestamp })
    // OPTIONS ...           -> CORS preflight

    // CORS helper
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (request.method === "GET" && pathname.endsWith("/api/songs")) {
        // Read songs list from KV
        const raw = await env.MUSIC_DB.get("songs");
        const songs = raw ? JSON.parse(raw) : [];
        // return newest first
        songs.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
        return new Response(JSON.stringify({ success: true, songs }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
        });
      }

      if (request.method === "POST" && pathname.endsWith("/api/songs")) {
        // Expect JSON body
        const body = await request.json().catch(() => null);
        if (!body) {
          return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const { title, artist, songURL, coverURL, timestamp } = body;
        if (!title || !artist || !songURL || !coverURL) {
          return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        // Read existing array
        const raw = await env.MUSIC_DB.get("songs");
        const songs = raw ? JSON.parse(raw) : [];

        // Create id and push
        const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
        const item = {
          id,
          title,
          artist,
          songURL,
          coverURL,
          timestamp: timestamp || Date.now()
        };

        songs.push(item);

        // Write back (note: KV writes are eventual-consistent; small race condition possible if simultaneous writes)
        await env.MUSIC_DB.put("songs", JSON.stringify(songs));

        return new Response(JSON.stringify({ success: true, song: item }), {
          status: 201,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Unknown route
      return new Response(JSON.stringify({ success: false, error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }
}
