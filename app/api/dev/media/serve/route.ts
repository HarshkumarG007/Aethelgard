import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(request: Request) {
  // Guard: Strictly disabled in production
  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing storage key" }, { status: 400 });
  }

  const baseDir = path.resolve(process.env.LOCAL_MEDIA_DIR || "./.dev-media");
  const filePath = path.resolve(baseDir, key);

  if (filePath === baseDir || !filePath.startsWith(baseDir + path.sep)) {
    return NextResponse.json(
      { error: "Invalid storage key: path traversal detected" },
      { status: 400 }
    );
  }

  try {
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type by extension
    let contentType = "application/octet-stream";
    if (key.endsWith(".webp")) contentType = "image/webp";
    else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (key.endsWith(".png")) contentType = "image/png";
    else if (key.endsWith(".avif")) contentType = "image/avif";
    else if (key.endsWith(".mp4")) contentType = "video/mp4";
    else if (key.endsWith(".webm")) contentType = "video/webm";
    else if (key.endsWith(".mp3")) contentType = "audio/mpeg";
    else if (key.endsWith(".m4a")) contentType = "audio/mp4";
    else if (key.endsWith(".wav")) contentType = "audio/wav";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Read failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
