import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, cookieOptions, signToken } from "@/lib/auth";
import { fail } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/lib/models";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password) return fail("Email and password are required");

  await connectDB();
  const admin = await Admin.findOne({ email }).select("+passwordHash");

  // Same message for unknown email and wrong password, so the form cannot be
  // used to discover which admin accounts exist.
  if (!admin || !admin.active) return fail("Invalid email or password", 401);

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return fail("Invalid email or password", 401);

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = await signToken({
    role: "admin",
    uid: String(admin._id),
    email: admin.email,
    name: admin.name,
  });

  const res = NextResponse.json({
    ok: true,
    admin: { email: admin.email, name: admin.name },
  });
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions);
  return res;
}
