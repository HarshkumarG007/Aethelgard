export type UserRole = "viewer" | "admin";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  createdAt: Date;
}

export type SessionErrorCode =
  | "UNAUTHENTICATED"
  | "EXPIRED"
  | "REVOKED"
  | "IDLE_TIMEOUT";

export type SessionValidationResult =
  | {
      valid: true;
      user: AuthenticatedUser;
      sessionId: string;
    }
  | {
      valid: false;
      error: SessionErrorCode;
    };

export const AUTH_CONSTANTS = {
  SESSION_COOKIE_NAME: "__Host-session",
  SESSION_IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes of inactivity
  SESSION_ABSOLUTE_LIFETIME_MS: 24 * 60 * 60 * 1000, // 24 hours absolute maximum
  MIN_PASSPHRASE_LENGTH: 12,
  ARGON2_PARAMS: {
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 threads
  },
} as const;
