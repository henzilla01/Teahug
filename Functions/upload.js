export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const song = formData.get("song");
  const cover = formData.get("cover");

  if (!song || !cover) {
    return new Response(JSON.stringify({ success: false, message: "Missing files" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const songKey = `songs/${song.name}`;
  const coverKey = `covers/${cover.name}`;

  await env.R2_BUCKET.put(songKey, song.stream());
  await env.R2_BUCKET.put(coverKey, cover.stream());

  const songUrl = `https://${env.R2_BUCKET_DOMAIN}/${songKey}`;
  const coverUrl = `https://${env.R2_BUCKET_DOMAIN}/${coverKey}`;

  return new Response(JSON.stringify({ success: true, songUrl, coverUrl }), {
    headers: { "Content-Type": "application/json" },
  });
}
