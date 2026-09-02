import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Milestone, Project, Task } from "@/lib/models";
import { fail, guardAdmin, isBeforeDay, isValidObjectId, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad milestone id", 400);

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid body");

  const update: Record<string, unknown> = {};
  for (const field of ["title", "description", "status", "dueDate", "order"]) {
    if (field in body) update[field] = body[field] === "" ? null : body[field];
  }
  if (Array.isArray(body.developers)) update.developers = body.developers;

  await connectDB();

  if ("dueDate" in update && update.dueDate) {
    const current = await Milestone.findById(id).select("project").lean();
    if (!current) return fail("Milestone not found", 404);
    const project = await Project.findById(current.project)
      .select("startDate")
      .lean();
    if (isBeforeDay(update.dueDate, project?.startDate))
      return fail("Due date cannot be before the project start date");
  }

  const milestone = await Milestone.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
    .populate("developers", "name role color")
    .lean();
  if (!milestone) return fail("Milestone not found", 404);
  return json(milestone);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad milestone id", 400);

  await connectDB();
  const milestone = await Milestone.findByIdAndDelete(id);
  if (!milestone) return fail("Milestone not found", 404);
  await Task.deleteMany({ milestone: id });
  return json({ ok: true });
}
