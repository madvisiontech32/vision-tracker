import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Task, TASK_STATUSES } from "@/lib/models";
import { fail, isValidObjectId, json } from "@/lib/api";
import { getDeveloperSession } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

/**
 * A developer may move their own task along the board and nothing else.
 * Title, priority, due date and ownership stay admin-only.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getDeveloperSession();
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad task id", 400);

  const body = await req.json().catch(() => null);
  const status = String(body?.status ?? "");
  if (!(TASK_STATUSES as readonly string[]).includes(status))
    return fail("Unknown status");

  await connectDB();
  const task = await Task.findOneAndUpdate(
    { _id: id, developer: session.uid },
    { status },
    { new: true, runValidators: true }
  ).lean();

  // Missing or owned by somebody else - same answer either way.
  if (!task) return fail("Task not found", 404);

  return json({ _id: String(task._id), status: task.status });
}
