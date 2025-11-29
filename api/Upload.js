export const config = {
  path: "/api/upload",
  memory: "128MB"
};

export async function onRequestPost({ request, env }) {
  try {
    const MAX_SIZE = 8 * 1024 * 1024; // 8 MB per file

    const formData = await request.formData();
    const song = formData.get("song");
    const cover = formData.get("cover");

    if (!song || !cover) {
      return new Response(JSON.stringify({ success: false, error: "Missing files" }), { status: 400 });
    }

    if (song.size > MAX_SIZE || cover.size > MAX_SIZE) {
      return new Response(JSON.stringify({ success: false, error: "File too large" }), { status: 413 });
    }

    // Upload to R2 bucket
    const songKey = `songs/${song.name}`;
    const coverKey = `covers/${cover.name}`;

    await env.TEAHUG1.put(songKey, await song.arrayBuffer(), {
      httpMetadata: { contentType: song.type }
    });

    await env.TEAHUG1.put(coverKey, await cover.arrayBuffer(), {
      httpMetadata: { contentType: cover.type }
    });

    return new Response(JSON.stringify({
      success: true,
      songUrl: `https://pub-83823864dc904706888338cd05e3b128.r2.dev/${songKey}`,
      coverUrl: `https://pub-83823864dc904706888338cd05e3b128.r2.dev/${coverKey}`
    }));
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
