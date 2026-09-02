import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project, Milestone } from "@/lib/models";
import { fail, guardAdmin, isBeforeDay, json } from "@/lib/api";
import { isAdmin } from "@/lib/session";

/** Public project list (never exposes the access password hash). */
export async function GET() {
  await connectDB();
  const admin = await isAdmin();
  const filter = admin ? {} : { visible: true };

  const projects = await Project.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .lean();
  const counts = await Milestone.aggregate([
    { $group: { _id: "$project", total: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.total]));

  return json(
    projects.map((p) => ({
      ...p,
      _id: String(p._id),
      milestoneCount: countMap.get(String(p._id)) ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return fail("Project name is required");
  if (!body?.password || String(body.password).length < 4)
    return fail("Client password must be at least 4 characters");
  if (isBeforeDay(body.endDate, body.startDate))
    return fail("Target end date cannot be before the start date");

  await connectDB();
  const project = await Project.create({
    // New projects go to the end of the list.
    order: await Project.countDocuments(),
    name: body.name.trim(),
    client: body.client?.trim() ?? "",
    description: body.description?.trim() ?? "",
    status: body.status ?? "planning",
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    visible: body.visible ?? true,
    accessPasswordHash: await bcrypt.hash(String(body.password), 10),
  });

  const safe = project.toObject();
  delete safe.accessPasswordHash;
  return json({ ...safe, _id: String(project._id) }, 201);
}
