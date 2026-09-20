import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export interface AuditEventParams {
  userId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: "success" | "failure";
  metadata?: Record<string, unknown>;
}

/**
 * Writes an audit event to PostgreSQL.
 * 
 * Strict privacy rules:
 * - NEVER log passphrases, session tokens, encryption secrets, or memory plaintext.
 * - All metadata must be sanitized before passing to this function.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    // Sanitize metadata defensively to remove any accidental secret keys
    let sanitizedMetadata: Record<string, unknown> | undefined = undefined;
    if (params.metadata) {
      sanitizedMetadata = { ...params.metadata };
      const bannedKeys = [
        "passphrase",
        "password",
        "token",
        "tokenHash",
        "secret",
        "cookie",
        "bodyText",
      ];
      for (const key of Object.keys(sanitizedMetadata)) {
        if (bannedKeys.some((banned) => key.toLowerCase().includes(banned.toLowerCase()))) {
          sanitizedMetadata[key] = "[REDACTED]";
        }
      }
    }

    await db.insert(auditLogs).values({
      userId: params.userId || null,
      action: params.action,
      resourceType: params.resourceType || null,
      resourceId: params.resourceId || null,
      outcome: params.outcome || "success",
      metadata: sanitizedMetadata || null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Audit logging failure should be logged to console without secrets, but never crash caller
    console.error("[AUDIT] Failed to record audit log:", (error as Error).message);
  }
}
