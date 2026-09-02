import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Developer } from "@/lib/models";
import { fail, guardAdmin, json } from "@/lib/api";

export const MIN_PASSWORD = 6;

export function normaliseEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseSkills(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  await connectDB();
  const developers = await Developer.find().sort({ name: 1 }).lean();
  return json(developers);
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return fail("Developer name is required");

  // Login credentials are set here, at creation, so a new developer can sign in
  // to /developer straight away.
  const email = normaliseEmail(body.email);
  if (!email) return fail("Login email is required");
  if (!isEmail(email)) return fail("That does not look like a valid email");

  const password = String(body.password ?? "");
  if (password.length < MIN_PASSWORD)
    return fail(`Password must be at least ${MIN_PASSWORD} characters`);

  await connectDB();
  if (await Developer.exists({ email }))
    return fail("Another developer already uses that email");

  const developer = await Developer.create({
    name: body.name.trim(),
    email,
    role: body.role?.trim() || "Developer",
    skills: parseSkills(body.skills),
    color: body.color || "#6b6b6b",
    passwordHash: await bcrypt.hash(password, 10),
  });

  const safe = developer.toObject();
  delete safe.passwordHash;
  return json({ ...safe, _id: String(developer._id) }, 201);
}
