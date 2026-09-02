import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models";
import { fail, guardAdmin, isValidObjectId, json } from "@/lib/api";

/**
 * Sets the display order of every project at once.
 *
 * The client sends the full list of ids in the order it wants; position is the
 * index in that array. Sending the whole list rather than a single move keeps
 * the result unambiguous when two tabs reorder at the same time - the last
 * write simply wins, instead of leaving two projects sharing a position.
 */
export async function PATCH(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;

  if (!Array.isArray(ids) || ids.length === 0)
    return fail("Send the projects as an array of ids");
  if (!ids.every((id) => typeof id === "string" && isValidObjectId(id)))
    return fail("One of the ids is not a project id");
  if (new Set(ids).size !== ids.length) return fail("Duplicate id in the list");

  await connectDB();

  const found = await Project.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) return fail("One of those projects no longer exists", 404);

  await Project.bulkWrite(
    ids.map((id, order) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order } } },
    }))
  );

  return json({ ok: true, count: ids.length });
}
