import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 20000, // Headroom for Argon2id cryptographic computation
    fileParallelism: false, // Run test files sequentially to avoid concurrent database truncate race conditions
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
