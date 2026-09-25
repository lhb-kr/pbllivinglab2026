import "server-only";
import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "chowon_admin";

export const adminPassword = () => process.env.ADMIN_PASSWORD || "chowon2026";

export const tokenFor = (pw: string) =>
  createHash("sha256").update(`chowon-cloud:${pw}`).digest("hex");

export async function isAdmin() {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === tokenFor(adminPassword());
}
