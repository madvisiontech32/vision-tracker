import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Developer } from "@/lib/models";
import { fail, guardAdmin, json } from "@/lib/api";

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

  await connectDB();
  const developer = await Developer.create({
    name: body.name.trim(),
    email: body.email?.trim() ?? "",
    role: body.role?.trim() || "Developer",
    skills: Array.isArray(body.skills)
      ? body.skills
      : String(body.skills ?? "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
    color: body.color || "#6366f1",
  });

  return json(developer.toObject(), 201);
}
