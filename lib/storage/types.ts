export interface UploadAuthParams {
  assetId: string;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  expiresInSeconds?: number;
}

export interface UploadAuth {
  assetId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}

export interface DownloadAuthParams {
  storageKey: string;
  expiresInSeconds?: number;
}

export interface DownloadAuth {
  url: string;
  expiresAt: string;
}

export interface ObjectMeta {
  sizeBytes: number;
  etag: string;
  contentType: string;
}

export interface VariantManifest {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
}

export interface MediaStorage {
  createUploadAuthorization(params: UploadAuthParams): Promise<UploadAuth>;
  verifyUploadedObject(storageKey: string): Promise<ObjectMeta>;
  createDownloadAuthorization(params: DownloadAuthParams): Promise<DownloadAuth>;
  deleteObject(storageKey: string): Promise<void>;
  processImageVariants?(sourceKey: string, assetId: string): Promise<VariantManifest>;
}
