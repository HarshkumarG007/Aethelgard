import fs from "node:fs/promises";
import path from "node:path";
import type {
  MediaStorage,
  UploadAuthParams,
  UploadAuth,
  DownloadAuthParams,
  DownloadAuth,
  ObjectMeta,
} from "./types";

export interface LocalMediaStorageOptions {
  baseDir?: string;
}

export class LocalMediaStorage implements MediaStorage {
  private baseDir: string;

  constructor(options: LocalMediaStorageOptions = {}) {
    this.baseDir = path.resolve(options.baseDir || "./.dev-media");
  }

  private getFilePath(storageKey: string): string {
    // Sanitize to prevent path traversal
    const safeKey = storageKey.replace(/\.\./g, "");
    return path.join(this.baseDir, safeKey);
  }

  async createUploadAuthorization(params: UploadAuthParams): Promise<UploadAuth> {
    const expiresAt = new Date(
      Date.now() + (params.expiresInSeconds || 900) * 1000
    ).toISOString();

    const filePath = this.getFilePath(params.storageKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    return {
      assetId: params.assetId,
      uploadUrl: `/api/dev/media/upload?key=${encodeURIComponent(params.storageKey)}`,
      method: "PUT",
      headers: {
        "Content-Type": params.contentType,
      },
      expiresAt,
    };
  }

  async verifyUploadedObject(storageKey: string): Promise<ObjectMeta> {
    const filePath = this.getFilePath(storageKey);
    const stats = await fs.stat(filePath);

    return {
      sizeBytes: stats.size,
      etag: `W/"${stats.size}-${stats.mtimeMs}"`,
      contentType: "application/octet-stream",
    };
  }

  async createDownloadAuthorization(params: DownloadAuthParams): Promise<DownloadAuth> {
    const expiresAt = new Date(
      Date.now() + (params.expiresInSeconds || 300) * 1000
    ).toISOString();

    return {
      url: `/api/dev/media/serve?key=${encodeURIComponent(params.storageKey)}`,
      expiresAt,
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    const filePath = this.getFilePath(storageKey);
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }
}
