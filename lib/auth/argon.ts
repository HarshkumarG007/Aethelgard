import { hash, verify } from "@node-rs/argon2";
import { AUTH_CONSTANTS } from "./types";

/**
 * Server-side Argon2id hashing and verification.
 * 
 * Cryptographic parameters tuned per OWASP guidelines:
 * - Algorithm: Argon2id (v=19)
 * - Memory cost: 65536 KB (64 MB)
 * - Time cost: 3 iterations
 * - Parallelism: 4 threads
 * 
 * Security rules:
 * - Plaintext passphrases NEVER enter logs or memory dumps.
 * - This code must NEVER execute on the browser client.
 */

// Pre-computed dummy hash with identical parameters used for constant-time dummy verification
const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHRmb3JkdW1teQ$E9y213l376cQn6a+LqQn6a+LqQn6a+LqQn6a+LqQn6Y";

export async function hashPassphrase(passphrase: string): Promise<string> {
  if (!passphrase || passphrase.length < AUTH_CONSTANTS.MIN_PASSPHRASE_LENGTH) {
    throw new Error(
      `Passphrase does not meet minimum length requirement of ${AUTH_CONSTANTS.MIN_PASSPHRASE_LENGTH} characters.`
    );
  }

  return hash(passphrase, {
    memoryCost: AUTH_CONSTANTS.ARGON2_PARAMS.memoryCost,
    timeCost: AUTH_CONSTANTS.ARGON2_PARAMS.timeCost,
    parallelism: AUTH_CONSTANTS.ARGON2_PARAMS.parallelism,
  });
}

export async function verifyPassphrase(
  storedHash: string,
  candidatePassphrase: string
): Promise<boolean> {
  if (!storedHash || !candidatePassphrase) {
    return false;
  }

  try {
    return await verify(storedHash, candidatePassphrase);
  } catch {
    // If hash format is invalid, fail safely without throwing
    return false;
  }
}

/**
 * Executes a dummy verification to prevent timing side-channel attacks
 * when an account does not exist or input is malformed.
 */
export async function performDummyVerification(): Promise<void> {
  try {
    await verify(DUMMY_ARGON2_HASH, "timing_protection_dummy_candidate");
  } catch {
    // Expected to fail, purely consumes constant compute time
  }
}
