import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project, Milestone, Task } from "@/lib/models";
import { fail, guardAdmin, isBeforeDay, isValidObjectId, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad project id", 400);

  await connectDB();
  const project = await Project.findById(id).lean();
  if (!project) return fail("Project not found", 404);
  return json({ ...project, _id: String(project._id) });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad project id", 400);

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid body");

  const update: Record<string, unknown> = {};
  for (const field of [
    "name",
    "client",
    "description",
    "status",
    "startDate",
    "endDate",
    "visible",
  ]) {
    if (field in body) update[field] = body[field] === "" ? null : body[field];
  }
  if (update.name !== undefined && !String(update.name).trim())
    return fail("Project name cannot be empty");

  // Rotating the client password is optional on every save.
  if (body.password) {
    if (String(body.password).length < 4)
      return fail("Client password must be at least 4 characters");
    update.accessPasswordHash = await bcrypt.hash(String(body.password), 10);
  }

  await connectDB();
  const current = await Project.findById(id).lean();
  if (!current) return fail("Project not found", 404);

  const startDate =
    "startDate" in update ? update.startDate : current.startDate;
  const endDate = "endDate" in update ? update.endDate : current.endDate;
  if (isBeforeDay(endDate, startDate))
    return fail("Target end date cannot be before the start date");

  const project = await Project.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!project) return fail("Project not found", 404);
  return json({ ...project, _id: String(project._id) });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad project id", 400);

  await connectDB();
  const project = await Project.findByIdAndDelete(id);
  if (!project) return fail("Project not found", 404);

  await Promise.all([
    Milestone.deleteMany({ project: id }),
    Task.deleteMany({ project: id }),
  ]);

  return json({ ok: true });
}
