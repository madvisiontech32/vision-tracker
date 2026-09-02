import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "pt_admin";
export const DEV_COOKIE = "pt_dev";

// A guessable signing key means anyone can forge an admin cookie, so in
// production a missing SESSION_SECRET fails loudly instead of falling back.
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is not set. Generate one with " +
      "`node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"` " +
      "and add it to your environment variables."
  );
}

const SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";

function key() {
  return new TextEncoder().encode(SECRET);
}

export async function signToken(
  payload: Record<string, unknown>,
  expiresIn = "7d"
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key());
}

export async function verifyToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
