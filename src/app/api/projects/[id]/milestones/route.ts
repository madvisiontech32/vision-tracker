import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Milestone, Project } from "@/lib/models";
import { fail, guardAdmin, isBeforeDay, isValidObjectId, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad project id", 400);

  await connectDB();
  const milestones = await Milestone.find({ project: id })
    .populate("developers", "name role color")
    .sort({ order: 1, createdAt: 1 })
    .lean();
  return json(milestones);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad project id", 400);

  const body = await req.json().catch(() => null);
  if (!body?.title?.trim()) return fail("Milestone title is required");

  await connectDB();
  const project = await Project.findById(id).select("startDate").lean();
  if (!project) return fail("Project not found", 404);
  if (isBeforeDay(body.dueDate, project.startDate))
    return fail("Due date cannot be before the project start date");

  const count = await Milestone.countDocuments({ project: id });
  const milestone = await Milestone.create({
    project: id,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    status: body.status ?? "pending",
    dueDate: body.dueDate || null,
    order: typeof body.order === "number" ? body.order : count,
    developers: Array.isArray(body.developers) ? body.developers : [],
  });

  return json(milestone.toObject(), 201);
}
