export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const formData = await request.formData();
    const song = formData.get("song");
    const cover = formData.get("cover");

    if (!song || !cover) {
      return new Response(JSON.stringify({ success: false, message: "Missing files" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save files to R2
    const songKey = `songs/${song.name}`;
    const coverKey = `covers/${cover.name}`;

    await env.R2_BUCKET.put(songKey, song.stream());
    await env.R2_BUCKET.put(coverKey, cover.stream());

    // Build public URLs
    const songUrl = `${env.R2_BUCKET_DOMAIN}/${songKey}`;
    const coverUrl = `${env.R2_BUCKET_DOMAIN}/${coverKey}`;

    return new Response(JSON.stringify({ success: true, songUrl, coverUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
