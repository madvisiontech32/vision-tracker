import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models";
import { getProjectTree } from "@/lib/queries";
import { fail, isValidObjectId, json } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Verifies the client password and returns the whole project tree.
 *
 * Deliberately sets no cookie: the unlocked data lives only in the page's
 * memory, so leaving and coming back always asks for the password again.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidObjectId(id)) return fail("Bad project id", 400);

  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!password) return fail("Password is required");

  await connectDB();
  const project = await Project.findById(id).select("+accessPasswordHash visible");
  if (!project || !project.visible) return fail("Project not found", 404);

  const ok = await bcrypt.compare(String(password), project.accessPasswordHash);
  if (!ok) return fail("Incorrect password", 401);

  const tree = await getProjectTree(id);
  if (!tree) return fail("Project not found", 404);

  return json(tree);
}
