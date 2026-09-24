import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function PUT(request: Request) {
  // Guard: Strictly disabled in production
  if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing storage key" }, { status: 400 });
  }

  // Prevent path traversal
  const safeKey = key.replace(/\.\./g, "");
  const baseDir = path.resolve(process.env.LOCAL_MEDIA_DIR || "./.dev-media");
  const filePath = path.join(baseDir, safeKey);

  try {
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    return new Response(null, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Upload failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
