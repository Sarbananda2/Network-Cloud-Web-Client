import crypto from "crypto";

const TOKEN_LENGTH = 32;

export function generateToken(): { token: string; tokenHash: string; tokenPrefix: string } {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString("hex");
  const tokenHash = hashToken(token);
  const tokenPrefix = token.substring(0, 8);
  
  return { token, tokenHash, tokenPrefix };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
