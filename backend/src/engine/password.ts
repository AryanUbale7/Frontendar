import * as crypto from "crypto";

const PREFIX = "$fa$";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${PREFIX}${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.startsWith(PREFIX)) {
    return stored === password;
  }

  const payload = stored.slice(PREFIX.length);
  const sepIndex = payload.indexOf(":");
  if (sepIndex === -1) return false;

  const salt = payload.slice(0, sepIndex);
  const expectedHash = payload.slice(sepIndex + 1);
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");

  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isHashedPassword(stored: string): boolean {
  return stored.startsWith(PREFIX);
}
