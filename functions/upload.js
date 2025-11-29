export const onRequest = async ({ request, env }) => {
  try {
    const formData = await request.formData();

    const songFile = formData.get("song");
    const coverFile = formData.get("cover");

    if (!songFile || !coverFile) {
      return new Response(JSON.stringify({ success: false, error: "Files missing" }), { status: 400 });
    }

    // Upload to R2
    const songKey = `songs/${songFile.name}`;
    const coverKey = `covers/${coverFile.name}`;

    await env.TEAHUG.put(songKey, songFile.stream());
    await env.TEAHUG.put(coverKey, coverFile.stream());

    // Construct public URLs (for Pages deployments)
    const r2BaseURL = `https://${env.pub-bf38f9589fd44fdc8fd0388dcd8eeba5.r2.dev}/`; // replace PUBLIC_R2_DOMAIN with your R2 public domain
    const songUrl = r2BaseURL + songKey;
    const coverUrl = r2BaseURL + coverKey;

    return new Response(JSON.stringify({
      success: true,
      songUrl,
      coverUrl
    }), { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
};
