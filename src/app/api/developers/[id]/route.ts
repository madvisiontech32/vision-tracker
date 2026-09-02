import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Developer, Milestone, Task } from "@/lib/models";
import { fail, guardAdmin, isValidObjectId, json } from "@/lib/api";
import { MIN_PASSWORD, isEmail, normaliseEmail, parseSkills } from "../route";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad developer id", 400);

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid body");

  await connectDB();

  const update: Record<string, unknown> = {};
  for (const field of ["name", "role", "color", "active"]) {
    if (field in body) update[field] = body[field];
  }
  if ("skills" in body) update.skills = parseSkills(body.skills);

  if ("email" in body) {
    const email = normaliseEmail(body.email);
    if (!email) return fail("Login email is required");
    if (!isEmail(email)) return fail("That does not look like a valid email");
    if (await Developer.exists({ email, _id: { $ne: id } }))
      return fail("Another developer already uses that email");
    update.email = email;
  }

  // Blank means "keep the current password".
  if (body.password) {
    if (String(body.password).length < MIN_PASSWORD)
      return fail(`Password must be at least ${MIN_PASSWORD} characters`);
    update.passwordHash = await bcrypt.hash(String(body.password), 10);
  }

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
