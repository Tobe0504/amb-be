import { createDecipheriv, createHash, createCipheriv, randomBytes } from "crypto";

import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
  const source = env.MESSAGE_ENCRYPTION_KEY?.trim() || env.JWT_SECRET;
  return createHash("sha256").update(source).digest();
};

export type EncryptedPayload = {
  cipherText: string;
  iv: string;
  authTag: string;
};

export const encryptText = (plainText: string): EncryptedPayload => {
  const key = getEncryptionKey();
  const iv = randomBytes(12);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

export const decryptText = (payload: EncryptedPayload) => {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.cipherText, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
