import crypto from "crypto";
import { rateLimit, getClientIp } from "./rateLimit";

export interface AdminAuthError {
  status: number;
  error: string;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies the admin secret with a constant-time comparison and rate-limits
 * attempts per IP, so the password can't be brute-forced or timing-attacked.
 * Returns null when authorized, or an error object to send back to the client.
 */
export async function requireAdmin(req: Request): Promise<AdminAuthError | null> {
  const ip = getClientIp(req);
  const { success } = await rateLimit(`admin-auth:${ip}`, 20, 60_000); // 20/min per IP
  if (!success) {
    return { status: 429, error: "Too many attempts. Please wait a minute and try again." };
  }

  const provided = req.headers.get("x-admin-secret") || "";
  const expected = process.env.ADMIN_SECRET || "";
  if (!expected || !timingSafeEqual(provided, expected)) {
    return { status: 401, error: "Unauthorized" };
  }

  return null;
}
