import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { DeleteMilestoneButton } from "@/components/admin/DeleteMilestoneButton";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import { MilestoneFormDialog } from "@/components/admin/MilestoneFormDialog";
import { ProjectFormDialog } from "@/components/admin/ProjectFormDialog";
import {
  Avatar,
  ProgressBar,
  StatusBadge,
  formatDate,
  toDateInput,
} from "@/components/ui";
import { isValidObjectId } from "@/lib/api";
import { getMilestones, getProject } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminProjectPage({
  params,
}: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const project = await getProject(id);
  if (!project) notFound();

  const milestones = await getMilestones(id);
  const totalTasks = milestones.reduce((n, m) => n + m.taskCount, 0);
  const doneTasks = milestones.reduce((n, m) => n + m.doneCount, 0);
  const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  // Nothing in a project may be due before the project itself starts.
  const minDate = toDateInput(project.startDate);

  return (
    <>
      <Crumbs
        items={[
          { label: "Projects", href: "/admin/projects" },
          { label: project.name },
        ]}
      />

      <section className="card mb-8 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-heading">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
              {!project.visible ? (
                <span className="badge border-line bg-chip text-muted">
                  hidden from clients
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted">
              {project.client || "No client"} - {formatDate(project.startDate)} to{" "}
              {formatDate(project.endDate)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/projects/${id}`} target="_blank" className="btn-ghost btn-sm">
              Client view
            </Link>
            <ProjectFormDialog
              project={{
                _id: id,
                name: project.name,
                client: project.client ?? "",
                description: project.description ?? "",
                status: project.status,
                startDate: project.startDate ?? "",
                endDate: project.endDate ?? "",
                visible: project.visible ?? true,
              }}
              trigger="Edit project"
            />
            <DeleteProjectButton projectId={id} redirectTo="/admin/projects" />
          </div>
        </div>

        {project.description ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-body">
            {project.description}
          </p>
        ) : null}

        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>
              {milestones.length} milestones - {doneTasks}/{totalTasks} tasks done
            </span>
            <span className="font-semibold text-heading">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-heading">Milestones</h2>
          <p className="text-sm text-muted">
            Open a milestone to add developers and assign tasks.
          </p>
        </div>
        <MilestoneFormDialog projectId={id} minDate={minDate} />
      </div>

      {milestones.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-semibold text-heading">No milestones yet</p>
          <p className="mt-1 text-sm text-muted">
            Add your first milestone to start planning the work.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {milestones.map((m, i) => (
            <li key={m._id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-chip text-sm font-bold text-body">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/admin/projects/${id}/milestones/${m._id}`}
                      className="link-strong"
                    >
                      {m.title}
                    </Link>
                    <StatusBadge status={m.status} />
                  </div>
                  {m.description ? (
                    <p className="line-clamp-1 text-sm text-muted">
                      {m.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="flex -space-x-2">
                      {m.developers.map((d) => (
                        <span
                          key={d._id}
                          title={d.name}
                          className="rounded-full ring-2 ring-surface"
                        >
                          <Avatar name={d.name} color={d.color} size={28} />
                        </span>
                      ))}
                      {m.developers.length === 0 ? (
                        <span className="text-xs text-muted">
                          No developers assigned
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted">
                      {m.doneCount}/{m.taskCount} tasks - due {formatDate(m.dueDate)}
                    </span>
                  </div>

                  <div className="mt-3 max-w-md">
                    <ProgressBar value={m.progress} />
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/projects/${id}/milestones/${m._id}`}
                    className="btn-primary btn-sm"
                  >
                    Manage
                  </Link>
                  <MilestoneFormDialog
                    projectId={id}
                    milestone={m}
                    minDate={minDate}
                  />
                  <DeleteMilestoneButton milestoneId={m._id} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
