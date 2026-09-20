import type { MediaStorage } from "./types";
import { R2MediaStorage } from "./r2";
import { LocalMediaStorage } from "./local";

export function resolveMediaStorage(env: NodeJS.ProcessEnv = process.env): MediaStorage {
  const isProduction = env.NODE_ENV === "production" || env.APP_ENV === "production";

  if (isProduction) {
    const requiredKeys = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ] as const;

    const missing = requiredKeys.filter((k) => !env[k]);
    if (missing.length > 0) {
      throw new Error(
        `[FATAL] Production media storage configuration error: Missing required Cloudflare R2 variables: ${missing.join(
          ", "
        )}. Refusing to boot with silent downgrade.`
      );
    }

    return new R2MediaStorage({
      accountId: env.R2_ACCOUNT_ID!,
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      bucketName: env.R2_BUCKET_NAME!,
    });
  }

  // Local filesystem storage permitted only in non-production environments
  return new LocalMediaStorage({
    baseDir: env.LOCAL_MEDIA_DIR || "./.dev-media",
  });
}

// Lazy or eager storage singleton
let storageInstance: MediaStorage | null = null;
export function getStorage(): MediaStorage {
  if (!storageInstance) {
    storageInstance = resolveMediaStorage();
  }
  return storageInstance;
}

export const storage = getStorage();
export * from "./types";
export { R2MediaStorage } from "./r2";
export { LocalMediaStorage } from "./local";
