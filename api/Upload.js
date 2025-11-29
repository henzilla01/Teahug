export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();
    const songFile = formData.get("song");
    const coverFile = formData.get("cover");

    if (!songFile || !coverFile) {
      return new Response(JSON.stringify({ success: false, message: "Files missing" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Access R2 bucket
    const BUCKET = teahug; // variable from Pages binding
    const BUCKET_DOMAIN = https://e649bff25d83241bebe214ddd3beb656.r2.cloudflarestorage.com; // variable from env

    // Save song
    const songKey = `songs/${songFile.name}`;
    await BUCKET.put(songKey, songFile.stream());

    // Save cover
    const coverKey = `covers/${coverFile.name}`;
    await BUCKET.put(coverKey, coverFile.stream());

    return new Response(
      JSON.stringify({
        success: true,
        songUrl: `${BUCKET_DOMAIN}/${songKey}`,
        coverUrl: `${BUCKET_DOMAIN}/${coverKey}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
