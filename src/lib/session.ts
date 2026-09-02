import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyToken } from "./auth";

export type AdminSession = { uid: string; email: string; name: string };

/** The signed-in admin, or null. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const payload = await verifyToken(jar.get(ADMIN_COOKIE)?.value);
  if (payload?.role !== "admin") return null;
  return {
    uid: String(payload.uid ?? ""),
    email: String(payload.email ?? ""),
    name: String(payload.name ?? "Administrator"),
  };
}

/** True when the current request carries a valid admin session cookie. */
export async function isAdmin() {
  return (await getAdminSession()) !== null;
}
