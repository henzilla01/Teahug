export const onRequestPost = async ({ request, env }) => {
  try {
    // Parse the incoming form data
    const formData = await request.formData();
    const songFile = formData.get("song");
    const coverFile = formData.get("cover");

    if (!songFile || !coverFile) {
      return new Response(JSON.stringify({
        success: false,
        message: "Both song and cover files are required."
      }), { status: 400 });
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const songName = `${timestamp}-${songFile.name}`;
    const coverName = `${timestamp}-${coverFile.name}`;

    // Upload song to R2
    await env.TEAHUG.put(songName, songFile.stream(), {
      httpMetadata: { contentType: songFile.type }
    });

    // Upload cover to R2
    await env.TEAHUG.put(coverName, coverFile.stream(), {
      httpMetadata: { contentType: coverFile.type }
    });

    // Build URLs
    const songUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${songName}`;
    const coverUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${coverName}`;

    return new Response(JSON.stringify({
      success: true,
      songUrl,
      coverUrl
    }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({
      success: false,
      message: "Upload failed!",
      error: err.message
    }), { status: 500 });
  }
};
