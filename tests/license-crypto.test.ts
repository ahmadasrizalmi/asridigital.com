import { describe, it, expect, beforeAll } from "vitest";
import {
  bufferToBase64Url,
  base64UrlToBuffer,
  generateRandomSerialId,
  generateMasjidLicense,
  verifyMasjidLicense,
  ANDROID_PUBLIC_KEY_BASE64
} from "../functions/lib/license-crypto";

describe("License Crypto Engine", () => {
  let testPrivateKeyB64 = "";
  let testPublicKeyB64 = "";

  beforeAll(async () => {
    const keyPair = await crypto.subtle.generateKey(
      { name: "Ed25519" },
      true,
      ["sign", "verify"]
    ) as CryptoKeyPair;
    
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    
    testPrivateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
    testPublicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(spki)));
  });

  it("should encode and decode Base64URL without loss", () => {
    const original = new Uint8Array([0, 255, 127, 64, 32, 16, 8, 4, 2, 1]);
    const b64 = bufferToBase64Url(original);
    const decoded = base64UrlToBuffer(b64);
    expect(decoded).toEqual(original);
  });

  it("should generate a random serial id", () => {
    const serial = generateRandomSerialId(12);
    expect(serial.length).toBe(12);
    expect(/^[A-Z2-9]+$/.test(serial)).toBe(true);
  });

  it("should generate and verify a valid license", async () => {
    const license = await generateMasjidLicense(testPrivateKeyB64, "TESTSERIAL12");
    expect(license.serialId).toBe("TESTSERIAL12");
    expect(license.payload).toBe("1:MASJID:TESTSERIAL12");
    
    const parts = license.serialKey.split(".");
    expect(parts.length).toBe(2);

    const verification = await verifyMasjidLicense(testPublicKeyB64, license.serialKey);
    expect(verification.valid).toBe(true);
    expect(verification.payload).toBe("1:MASJID:TESTSERIAL12");
    expect(verification.serialId).toBe("TESTSERIAL12");
  });

  it("should fail verification if signature is tampered", async () => {
    const license = await generateMasjidLicense(testPrivateKeyB64, "TESTSERIAL12");
    
    const tamperedKey = license.serialKey.slice(0, -5) + "ABCDE";
    const verification = await verifyMasjidLicense(testPublicKeyB64, tamperedKey);
    
    expect(verification.valid).toBe(false);
    expect(verification.reason).toBe("SIGNATURE_MISMATCH");
  });

  it("should fail verification if payload is tampered", async () => {
    const license = await generateMasjidLicense(testPrivateKeyB64, "TESTSERIAL12");
    
    const parts = license.serialKey.split(".");
    const originalPayloadBytes = base64UrlToBuffer(parts[0]);
    // change first byte
    originalPayloadBytes[0] = originalPayloadBytes[0] === 0 ? 1 : 0;
    const tamperedPayloadB64 = bufferToBase64Url(originalPayloadBytes);
    const tamperedKey = `${tamperedPayloadB64}.${parts[1]}`;
    
    const verification = await verifyMasjidLicense(testPublicKeyB64, tamperedKey);
    
    expect(verification.valid).toBe(false);
    // Might be INVALID_PAYLOAD_STRUCTURE or SIGNATURE_MISMATCH depending on parsing
  });
  
  it("should fail gracefully with malformed format", async () => {
    const verification = await verifyMasjidLicense(testPublicKeyB64, "malformed_key_without_dot");
    expect(verification.valid).toBe(false);
    expect(verification.reason).toBe("MALFORMED_FORMAT");
  });

  it("should gracefully handle Android Public Key for invalid signature", async () => {
    const license = await generateMasjidLicense(testPrivateKeyB64, "ANDROIDTEST");
    const verification = await verifyMasjidLicense(ANDROID_PUBLIC_KEY_BASE64, license.serialKey);
    expect(verification.valid).toBe(false);
    expect(verification.reason).toBe("SIGNATURE_MISMATCH");
  });
});
