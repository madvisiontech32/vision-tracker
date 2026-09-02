import Link from "next/link";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import { ProjectFormDialog } from "@/components/admin/ProjectFormDialog";
import { ProjectOrderButtons } from "@/components/admin/ProjectOrderButtons";
import { ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { getPublicProjects } from "@/lib/queries";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models";

export const dynamic = "force-dynamic";

async function getAllProjects() {
  await connectDB();
  const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
  const publicOnes = await getPublicProjects();
  const statsMap = new Map(publicOnes.map((p) => [p._id, p]));

  return projects.map((p) => {
    const s = statsMap.get(String(p._id));
    return {
      _id: String(p._id),
      name: p.name as string,
      client: (p.client as string) ?? "",
      description: (p.description as string) ?? "",
      status: p.status as string,
      visible: (p.visible as boolean) ?? true,
      startDate: p.startDate ? new Date(p.startDate).toISOString() : "",
      endDate: p.endDate ? new Date(p.endDate).toISOString() : "",
      milestoneCount: s?.milestoneCount ?? 0,
      taskCount: s?.taskCount ?? 0,
      doneCount: s?.doneCount ?? 0,
      progress: s?.progress ?? 0,
    };
  });
}

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();
  // The order buttons swap positions within this exact list.
  const orderedIds = projects.map((p) => p._id);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            Create projects, set the client password, and manage milestones. The
            arrows set the order clients see on the home page.
          </p>
        </div>
        <ProjectFormDialog />
      </div>

      {projects.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-semibold text-heading">No projects yet</p>
          <p className="mt-1 text-sm text-muted">
            Hit &quot;New project&quot; to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p, i) => (
            <div key={p._id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/admin/projects/${p._id}`}
                      className="text-base link-strong"
                    >
                      {p.name}
                    </Link>
                    <StatusBadge status={p.status} />
                    {!p.visible ? (
                      <span className="badge border-line bg-chip text-muted">
                        hidden
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {p.client || "No client"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectOrderButtons ids={orderedIds} index={i} />
                  <ProjectFormDialog project={p} />
                  <DeleteProjectButton projectId={p._id} />
                </div>
              </div>

              <p className="mb-4 line-clamp-2 text-sm text-muted">
                {p.description || "No description."}
              </p>

              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>
                  {p.milestoneCount} milestones - {p.doneCount}/{p.taskCount} tasks
                </span>
                <span className="font-semibold text-heading">{p.progress}%</span>
              </div>
              <ProgressBar value={p.progress} />

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                <span>Ends {formatDate(p.endDate)}</span>
                <Link
                  href={`/admin/projects/${p._id}`}
                  className="text-xs link-strong"
                >
                  Manage milestones &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
