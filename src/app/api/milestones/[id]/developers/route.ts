import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Developer, Milestone, Task } from "@/lib/models";
import { fail, guardAdmin, isValidObjectId, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Assign an existing developer to this milestone. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad milestone id", 400);

  const { developerId } = await req.json().catch(() => ({ developerId: "" }));
  if (!isValidObjectId(developerId ?? "")) return fail("Bad developer id");

  await connectDB();
  if (!(await Developer.exists({ _id: developerId })))
    return fail("Developer not found", 404);

  const milestone = await Milestone.findByIdAndUpdate(
    id,
    { $addToSet: { developers: developerId } },
    { new: true }
  )
    .populate("developers", "name role color")
    .lean();
  if (!milestone) return fail("Milestone not found", 404);
  return json(milestone);
}

/** Remove a developer from this milestone (and their tasks inside it). */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { id } = await params;
  const developerId = new URL(req.url).searchParams.get("developerId") ?? "";
  if (!isValidObjectId(id) || !isValidObjectId(developerId))
    return fail("Bad id", 400);

  await connectDB();
  const milestone = await Milestone.findByIdAndUpdate(
    id,
    { $pull: { developers: developerId } },
    { new: true }
  )
    .populate("developers", "name role color")
    .lean();
  if (!milestone) return fail("Milestone not found", 404);

  await Task.deleteMany({ milestone: id, developer: developerId });
  return json(milestone);
}
