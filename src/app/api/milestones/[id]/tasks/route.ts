import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Milestone, Project, Task } from "@/lib/models";
import { fail, guardAdmin, isBeforeDay, isValidObjectId, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad milestone id", 400);

  const developerId = new URL(req.url).searchParams.get("developerId");
  const filter: Record<string, unknown> = { milestone: id };
  if (developerId && isValidObjectId(developerId)) filter.developer = developerId;

  await connectDB();
  const tasks = await Task.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  return json(tasks);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad milestone id", 400);

  const body = await req.json().catch(() => null);
  if (!body?.title?.trim()) return fail("Task title is required");
  if (!isValidObjectId(body.developer ?? "")) return fail("Pick a developer");

  await connectDB();
  const milestone = await Milestone.findById(id);
  if (!milestone) return fail("Milestone not found", 404);

  const assigned = milestone.developers.some(
    (d: unknown) => String(d) === String(body.developer)
  );
  if (!assigned) return fail("Developer is not assigned to this milestone");

  const project = await Project.findById(milestone.project)
    .select("startDate")
    .lean();
  if (isBeforeDay(body.dueDate, project?.startDate))
    return fail("Due date cannot be before the project start date");

  const count = await Task.countDocuments({
    milestone: id,
    developer: body.developer,
  });
  const task = await Task.create({
    project: milestone.project,
    milestone: id,
    developer: body.developer,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    status: body.status ?? "todo",
    priority: body.priority ?? "medium",
    dueDate: body.dueDate || null,
    order: count,
  });

  return json(task.toObject(), 201);
}
