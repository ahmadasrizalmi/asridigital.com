/**
 * Asri Digital — Masjid Display Offline License Cryptographic Engine
 * Path: functions/lib/license-crypto.ts
 * Uses Web Crypto API (SubtleCrypto) - Zero external npm dependencies
 */

export const PRODUCT_CODE = "MASJID";
export const LICENSE_VERSION = 1;
export const ANDROID_PUBLIC_KEY_BASE64 = "MCowBQYDK2VwAyEAb3vu+98LX2EWhWm028uH2hj/u+hj9cCajmQFoLZ/Nzg=";

export interface GeneratedLicense {
  serialId: string;
  payload: string;
  serialKey: string;
  createdAt: number;
}

export interface LicenseVerificationResult {
  valid: boolean;
  payload?: string;
  serialId?: string;
  reason?: string;
}

/**
 * Encode Uint8Array / ArrayBuffer to Base64URL string (RFC 4648 §5, without padding)
 */
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decode Base64URL string to Uint8Array (tolerates unpadded and padded strings)
 */
export function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a random cryptographic Serial ID (12 chars alfanumerik kapital, exclude ambiguous chars)
 */
export function generateRandomSerialId(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Import PKCS#8 Ed25519 Private Key from Base64
 */
export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  const binaryDer = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "Ed25519" },
    false,
    ["sign"]
  );
}

/**
 * Import SPKI Ed25519 Public Key from Base64
 */
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const binaryDer = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "Ed25519" },
    false,
    ["verify"]
  );
}

/**
 * Issue and sign a new offline license serial for Masjid Display
 */
export async function generateMasjidLicense(
  privateKeyBase64: string,
  customSerialId?: string
): Promise<GeneratedLicense> {
  const serialId = customSerialId ? customSerialId.toUpperCase().trim() : generateRandomSerialId(12);
  const payload = `${LICENSE_VERSION}:${PRODUCT_CODE}:${serialId}`;
  
  const privateKey = await importPrivateKey(privateKeyBase64);
  const payloadBytes = new TextEncoder().encode(payload);
  
  const signatureBuffer = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    payloadBytes
  );

  const payloadB64 = bufferToBase64Url(payloadBytes);
  const signatureB64 = bufferToBase64Url(signatureBuffer);
  const serialKey = `${payloadB64}.${signatureB64}`;

  return {
    serialId,
    payload,
    serialKey,
    createdAt: Date.now(),
  };
}

/**
 * Verify license serial using Ed25519 Public Key (X.509 SPKI Base64 format)
 */
export async function verifyMasjidLicense(
  publicKeyBase64: string,
  serialKey: string
): Promise<LicenseVerificationResult> {
  try {
    const parts = serialKey.trim().split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { valid: false, reason: "MALFORMED_FORMAT" };
    }

    const payloadBytes = base64UrlToBuffer(parts[0]);
    const signatureBytes = base64UrlToBuffer(parts[1]);
    const payloadText = new TextDecoder().decode(payloadBytes);

    const payloadParts = payloadText.split(":");
    if (
      payloadParts.length !== 3 ||
      parseInt(payloadParts[0], 10) !== LICENSE_VERSION ||
      payloadParts[1] !== PRODUCT_CODE
    ) {
      return { valid: false, reason: "INVALID_PAYLOAD_STRUCTURE" };
    }

    const serialId = payloadParts[2];
    const publicKey = await importPublicKey(publicKeyBase64);

    const isValid = await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      signatureBytes,
      payloadBytes
    );

    return isValid
      ? { valid: true, payload: payloadText, serialId }
      : { valid: false, reason: "SIGNATURE_MISMATCH" };
  } catch (err: any) {
    return { valid: false, reason: err.message || "VERIFICATION_FAILED" };
  }
}
