import { describe, it, expect } from "vitest";
import { resolveMediaStorage, LocalMediaStorage, R2MediaStorage } from "@/lib/storage";

describe("Phase 0: Storage Abstraction & Environment Guard", () => {
  it("uses LocalMediaStorage in development environment", () => {
    const devEnv: NodeJS.ProcessEnv = {
      NODE_ENV: "development",
      APP_ENV: "development",
    };

    const storage = resolveMediaStorage(devEnv);
    expect(storage).toBeInstanceOf(LocalMediaStorage);
  });

  it("fails fast with fatal error when R2 configuration is incomplete in production", () => {
    const prodEnvMissingR2: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      APP_ENV: "production",
      // Missing R2 credentials
    };

    expect(() => resolveMediaStorage(prodEnvMissingR2)).toThrowError(
      /\[FATAL\] Production media storage configuration error: Missing required Cloudflare R2 variables/
    );
  });

  it("fails fast if only partial R2 credentials are provided in production", () => {
    const prodEnvPartial: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      APP_ENV: "production",
      R2_ACCOUNT_ID: "test-account",
      // Missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
    };

    expect(() => resolveMediaStorage(prodEnvPartial)).toThrowError(
      /R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME/
    );
  });

  it("instantiates R2MediaStorage when all required credentials exist in production", () => {
    const prodEnvComplete: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      APP_ENV: "production",
      R2_ACCOUNT_ID: "test-account",
      R2_ACCESS_KEY_ID: "test-key-id",
      R2_SECRET_ACCESS_KEY: "test-secret",
      R2_BUCKET_NAME: "aethelgard-private",
    };

    const storage = resolveMediaStorage(prodEnvComplete);
    expect(storage).toBeInstanceOf(R2MediaStorage);
  });
});
