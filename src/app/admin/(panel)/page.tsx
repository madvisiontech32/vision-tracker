import Link from "next/link";
import { ProgressBar, Stat, StatusBadge, formatDate } from "@/components/ui";
import { getAdminStats, getPublicProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, projects] = await Promise.all([
    getAdminStats(),
    getPublicProjects(),
  ]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Overview of everything running across your projects.
          </p>
        </div>
        <Link href="/admin/projects" className="btn-primary">
          + New project
        </Link>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Projects" value={stats.projects} />
        <Stat label="Milestones" value={stats.milestones} />
        <Stat label="Developers" value={stats.developers} />
        <Stat label="Tasks" value={stats.tasks} />
        <Stat
          label="Completed"
          value={`${stats.doneTasks}/${stats.tasks}`}
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-heading">Recent projects</h2>

      {projects.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-semibold text-heading">No projects yet</p>
          <p className="mt-1 text-sm text-muted">
            Create your first project to start adding milestones and tasks.
          </p>
          <Link href="/admin/projects" className="btn-primary mt-5">
            Create project
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {projects.slice(0, 8).map((p) => (
            <Link
              key={p._id}
              href={`/admin/projects/${p._id}`}
              className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-chip"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-semibold text-heading">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {p.client || "No client"} - {p.milestoneCount} milestones -{" "}
                  {p.doneCount}/{p.taskCount} tasks
                </p>
              </div>
              <div className="w-40">
                <ProgressBar value={p.progress} />
              </div>
              <span className="w-24 text-right text-xs text-muted">
                {formatDate(p.endDate)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
