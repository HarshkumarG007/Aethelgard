/**
 * Strict file signature (magic bytes) verification.
 * Blocks disguised executables, HTML/script injection, and MIME spoofing.
 */

export function isExecutableOrScript(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // Windows PE (EXE / DLL): "MZ"
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) return true;

  // Linux ELF: "\x7fELF"
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) return true;

  // Mach-O binary
  if (
    (buffer[0] === 0xca && buffer[1] === 0xfe && buffer[2] === 0xba && buffer[3] === 0xbe) ||
    (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe) ||
    (buffer[0] === 0xce && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe)
  ) {
    return true;
  }

  // Script / HTML sniffing (check first 256 bytes)
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString("ascii").toLowerCase();
  if (
    head.includes("<html") ||
    head.includes("<script") ||
    head.includes("<!doctype html") ||
    head.includes("<?php") ||
    head.startsWith("#!/")
  ) {
    return true;
  }

  return false;
}

export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // 3. WebP: RIFF at [0..3] & WEBP at [8..11]
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  // 4. WAV: RIFF at [0..3] & WAVE at [8..11]
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return "audio/wav";
  }

  // 5. WebM: EBML header 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }

  // 6. MP3: ID3 header or Frame Sync
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return "audio/mpeg";
  }
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return "audio/mpeg";
  }

  // 7. ISO Base Media File Format (MP4 / AVIF / M4A)
  // 'ftyp' box at index 4..7
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    const extendedHeader = buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii").toLowerCase();

    if (brand.startsWith("avif") || brand.startsWith("avis") || extendedHeader.includes("avif")) {
      return "image/avif";
    }

    if (brand.startsWith("m4a") || extendedHeader.includes("m4a")) {
      return "audio/mp4";
    }

    // Default ISO box to video/mp4
    return "video/mp4";
  }

  return null;
}

/**
 * Validates that buffer magic bytes match the expected Content-Type.
 * Returns true if valid, false if invalid or disguised executable.
 */
export function validateMagicBytes(buffer: Buffer, expectedMimeType: string): boolean {
  if (isExecutableOrScript(buffer)) {
    return false;
  }

  const detected = detectMimeType(buffer);
  if (!detected) {
    return false;
  }

  // Allow MP4 video and audio/mp4 to be cross-compatible with ISO boxes if appropriate
  if (expectedMimeType === "audio/mp4" && (detected === "audio/mp4" || detected === "video/mp4")) {
    return true;
  }
  if (expectedMimeType === "video/mp4" && (detected === "video/mp4" || detected === "audio/mp4")) {
    return true;
  }

  return detected === expectedMimeType;
}
