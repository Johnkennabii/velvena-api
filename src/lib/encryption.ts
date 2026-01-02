import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment variable
 * @returns Buffer containing the encryption key
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string value using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:salt:encrypted
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error("Text to encrypt cannot be empty");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha512");

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:salt:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${salt.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * @param encryptedText - Encrypted text in format: iv:authTag:salt:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error("Encrypted text cannot be empty");
  }

  const parts = encryptedText.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted text format");
  }

  const ivHex = parts[0];
  const authTagHex = parts[1];
  const saltHex = parts[2];
  const encrypted = parts[3];

  if (!ivHex || !authTagHex || !saltHex || !encrypted) {
    throw new Error("Invalid encrypted text format - missing parts");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const salt = Buffer.from(saltHex, "hex");

  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha512");

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt OAuth tokens for secure storage
 * @param accessToken - OAuth access token
 * @param refreshToken - OAuth refresh token
 * @returns Object with encrypted tokens
 */
export function encryptOAuthTokens(accessToken: string, refreshToken: string) {
  return {
    encryptedAccessToken: encrypt(accessToken),
    encryptedRefreshToken: encrypt(refreshToken),
  };
}

/**
 * Decrypt OAuth tokens for API calls
 * @param encryptedAccessToken - Encrypted access token
 * @param encryptedRefreshToken - Encrypted refresh token
 * @returns Object with decrypted tokens
 */
export function decryptOAuthTokens(
  encryptedAccessToken: string,
  encryptedRefreshToken: string
) {
  return {
    accessToken: decrypt(encryptedAccessToken),
    refreshToken: decrypt(encryptedRefreshToken),
  };
}
