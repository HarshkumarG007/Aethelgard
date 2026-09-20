import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { hashPassphrase } from "../lib/auth/argon";
import { AUTH_CONSTANTS } from "../lib/auth/types";

async function provisionUsers() {
  console.log("[PROVISION] Starting administrative credential provisioning...");

  const viewerPassphrase = process.env.VIEWER_PASSPHRASE;
  const adminPassphrase = process.env.ADMIN_PASSPHRASE;

  if (!viewerPassphrase || !adminPassphrase) {
    console.error(
      "[FATAL] Both VIEWER_PASSPHRASE and ADMIN_PASSPHRASE must be set in environment."
    );
    process.exit(1);
  }

  if (viewerPassphrase.length < AUTH_CONSTANTS.MIN_PASSPHRASE_LENGTH) {
    console.error(
      `[FATAL] VIEWER_PASSPHRASE must be at least ${AUTH_CONSTANTS.MIN_PASSPHRASE_LENGTH} characters.`
    );
    process.exit(1);
  }

  if (adminPassphrase.length < AUTH_CONSTANTS.MIN_PASSPHRASE_LENGTH) {
    console.error(
      `[FATAL] ADMIN_PASSPHRASE must be at least ${AUTH_CONSTANTS.MIN_PASSPHRASE_LENGTH} characters.`
    );
    process.exit(1);
  }

  try {
    console.log("[PROVISION] Computing Argon2id verifiers server-side...");
    const viewerHash = await hashPassphrase(viewerPassphrase);
    const adminHash = await hashPassphrase(adminPassphrase);

    const now = new Date();

    // Check existing viewer
    const [existingViewer] = await db
      .select()
      .from(users)
      .where(eq(users.role, "viewer"))
      .limit(1);

    let viewerId: string;
    if (existingViewer) {
      await db
        .update(users)
        .set({ passphraseHash: viewerHash, updatedAt: now })
        .where(eq(users.id, existingViewer.id));
      viewerId = existingViewer.id;
      console.log(`[PROVISION] Updated existing viewer user verifier (ID: ${viewerId})`);
    } else {
      const [newViewer] = await db
        .insert(users)
        .values({
          role: "viewer",
          passphraseHash: viewerHash,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: users.id });
      viewerId = newViewer.id;
      console.log(`[PROVISION] Created new viewer user (ID: ${viewerId})`);
    }

    // Check existing admin
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    let adminId: string;
    if (existingAdmin) {
      await db
        .update(users)
        .set({ passphraseHash: adminHash, updatedAt: now })
        .where(eq(users.id, existingAdmin.id));
      adminId = existingAdmin.id;
      console.log(`[PROVISION] Updated existing admin user verifier (ID: ${adminId})`);
    } else {
      const [newAdmin] = await db
        .insert(users)
        .values({
          role: "admin",
          passphraseHash: adminHash,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: users.id });
      adminId = newAdmin.id;
      console.log(`[PROVISION] Created new admin user (ID: ${adminId})`);
    }

    console.log("[PROVISION] Administrative provisioning complete. Plaintext was never logged.");
  } catch (error) {
    console.error("[PROVISION] Provisioning failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

provisionUsers();
