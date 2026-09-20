import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  MediaStorage,
  UploadAuthParams,
  UploadAuth,
  DownloadAuthParams,
  DownloadAuth,
  ObjectMeta,
} from "./types";

export interface R2MediaStorageOptions {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class R2MediaStorage implements MediaStorage {
  private client: S3Client;
  private bucketName: string;

  constructor(options: R2MediaStorageOptions) {
    this.bucketName = options.bucketName;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${options.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async createUploadAuthorization(params: UploadAuthParams): Promise<UploadAuth> {
    const expiresIn = params.expiresInSeconds || 900; // 15 minutes default
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: params.storageKey,
      ContentType: params.contentType,
      ContentLength: params.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      assetId: params.assetId,
      uploadUrl,
      method: "PUT",
      headers: {
        "Content-Type": params.contentType,
      },
      expiresAt,
    };
  }

  async verifyUploadedObject(storageKey: string): Promise<ObjectMeta> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    const response = await this.client.send(command);

    return {
      sizeBytes: response.ContentLength ?? 0,
      etag: response.ETag?.replace(/"/g, "") || "",
      contentType: response.ContentType || "application/octet-stream",
    };
  }

  async createDownloadAuthorization(params: DownloadAuthParams): Promise<DownloadAuth> {
    const expiresIn = params.expiresInSeconds || 300; // 5 minutes default
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: params.storageKey,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return {
      url,
      expiresAt,
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    await this.client.send(command);
  }
}
