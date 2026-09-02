import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { DEV_COOKIE, cookieOptions, signToken } from "@/lib/auth";
import { fail } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Developer } from "@/lib/models";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) return fail("Email and password are required");

  await connectDB();
  const developer = await Developer.findOne({ email }).select("+passwordHash");

  // One message for every failure, so the form cannot be used to discover
  // which developers exist or which of them have a password set.
  const invalid = fail("Invalid email or password", 401);
  if (!developer || !developer.active || !developer.passwordHash) return invalid;
  if (!(await bcrypt.compare(password, developer.passwordHash))) return invalid;

  developer.lastLoginAt = new Date();
  await developer.save();

  const token = await signToken({
    role: "developer",
    uid: String(developer._id),
    email: developer.email,
    name: developer.name,
  });

  const res = NextResponse.json({
    ok: true,
    developer: { name: developer.name, email: developer.email },
  });
  res.cookies.set(DEV_COOKIE, token, cookieOptions);
  return res;
}
