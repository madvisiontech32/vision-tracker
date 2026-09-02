import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Developer, Milestone, Task } from "@/lib/models";
import { fail, guardAdmin, isValidObjectId, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad developer id", 400);

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid body");

  const update: Record<string, unknown> = {};
  for (const field of ["name", "email", "role", "color", "active"]) {
    if (field in body) update[field] = body[field];
  }
  if ("skills" in body) {
    update.skills = Array.isArray(body.skills)
      ? body.skills
      : String(body.skills ?? "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
  }

  await connectDB();
  const developer = await Developer.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!developer) return fail("Developer not found", 404);
  return json(developer);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad developer id", 400);

  await connectDB();
  const developer = await Developer.findByIdAndDelete(id);
  if (!developer) return fail("Developer not found", 404);

  await Promise.all([
    Task.deleteMany({ developer: id }),
    Milestone.updateMany({}, { $pull: { developers: id } }),
  ]);

  return json({ ok: true });
}
