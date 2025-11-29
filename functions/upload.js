export const onRequestPost = async ({ request, env }) => {
  try {
    // Parse uploaded form data
    const formData = await request.formData();
    const song = formData.get("song");
    const cover = formData.get("cover");

    if (!song || !cover) {
      return new Response(JSON.stringify({ success: false, error: "Missing files" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate unique filenames
    const songFileName = `songs/${Date.now()}-${song.name}`;
    const coverFileName = `covers/${Date.now()}-${cover.name}`;

    // Upload song to R2
    await env.TeaHug.put(songFileName, await song.arrayBuffer(), {
      httpMetadata: { contentType: song.type }
    });

    // Upload cover to R2
    await env.TeaHug.put(coverFileName, await cover.arrayBuffer(), {
      httpMetadata: { contentType: cover.type }
    });

    // PUBLIC URL format
    const baseURL = "https://e649bff25d83241bebe214ddd3beb656.r2.cloudflarestorage.com";

    return new Response(
      JSON.stringify({
        success: true,
        songUrl: `${baseURL}/${songFileName}`,
        coverUrl: `${baseURL}/${coverFileName}`
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
