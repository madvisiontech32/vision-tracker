import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { AssignDevelopers } from "@/components/admin/AssignDevelopers";
import { DeleteMilestoneButton } from "@/components/admin/DeleteMilestoneButton";
import { MilestoneFormDialog } from "@/components/admin/MilestoneFormDialog";
import { TaskFormDialog } from "@/components/admin/TaskFormDialog";
import {
  DeleteTaskButton,
  TaskStatusSelect,
} from "@/components/admin/TaskRowActions";
import {
  Avatar,
  ProgressBar,
  StatusBadge,
  formatDate,
  toDateInput,
} from "@/components/ui";
import { isValidObjectId } from "@/lib/api";
import {
  getDevelopers,
  getMilestoneDetail,
  getProject,
  getTasksByDeveloper,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMilestonePage({
  params,
}: PageProps<"/admin/projects/[id]/milestones/[mid]">) {
  const { id, mid } = await params;
  if (!isValidObjectId(id) || !isValidObjectId(mid)) notFound();

  const [project, milestone, pool, tasksByDev] = await Promise.all([
    getProject(id),
    getMilestoneDetail(id, mid),
    getDevelopers(),
    getTasksByDeveloper(mid),
  ]);
  if (!project || !milestone) notFound();

  const allTasks = Object.values(tasksByDev).flat();
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  // Nothing in a project may be due before the project itself starts.
  const minDate = toDateInput(project.startDate);

  return (
    <>
      <Crumbs
        items={[
          { label: "Projects", href: "/admin/projects" },
          { label: project.name, href: `/admin/projects/${id}` },
          { label: milestone.title },
        ]}
      />

      <section className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-heading">
                {milestone.title}
              </h1>
              <StatusBadge status={milestone.status} />
            </div>
            <p className="text-sm text-muted">
              Due {formatDate(milestone.dueDate)} - {milestone.developers.length}
              &nbsp;{milestone.developers.length === 1 ? "developer" : "developers"}
              &nbsp;- {doneTasks}/{totalTasks} tasks done
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${id}`}
              target="_blank"
              className="btn-ghost btn-sm"
            >
              Client view
            </Link>
            <MilestoneFormDialog
              projectId={id}
              minDate={minDate}
              milestone={{
                _id: mid,
                title: milestone.title,
                description: milestone.description,
                status: milestone.status,
                dueDate: milestone.dueDate,
              }}
            />
            <DeleteMilestoneButton
              milestoneId={mid}
              redirectTo={`/admin/projects/${id}`}
            />
          </div>
        </div>

        {milestone.description ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-body">
            {milestone.description}
          </p>
        ) : null}

        <div className="mt-5">
          <ProgressBar value={progress} />
        </div>
      </section>

      <div className="mb-6">
        <AssignDevelopers
          milestoneId={mid}
          assigned={milestone.developers.map((d) => ({
            _id: d._id,
            name: d.name,
            role: d.role,
            color: d.color,
          }))}
          pool={pool.map((d) => ({
            _id: d._id,
            name: d.name,
            role: d.role,
            color: d.color,
          }))}
        />
        {pool.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Your team pool is empty.&nbsp;
            <Link href="/admin/developers" className="link-strong">
              Add developers first
            </Link>
          </p>
        ) : null}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-heading">Tasks by developer</h2>

      {milestone.developers.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-semibold text-heading">Assign a developer first</p>
          <p className="mt-1 text-sm text-muted">
            Tasks are always attached to a developer on this milestone.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestone.developers.map((d) => {
            const tasks = tasksByDev[d._id] ?? [];
            const done = tasks.filter((t) => t.status === "done").length;

            return (
              <section key={d._id} className="card overflow-hidden">
                <header className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-4">
                  <Avatar name={d.name} color={d.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-heading">{d.name}</h3>
                    <p className="text-xs text-muted">
                      {d.role} - {done}/{tasks.length} tasks done
                    </p>
                  </div>
                  <div className="w-32">
                    <ProgressBar
                      value={tasks.length ? (done / tasks.length) * 100 : 0}
                    />
                  </div>
                  <TaskFormDialog
                    milestoneId={mid}
                    developerId={d._id}
                    developerName={d.name}
                    minDate={minDate}
                  />
                </header>

                {tasks.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted">
                    No tasks yet for {d.name}.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {tasks.map((t) => (
                      <li
                        key={t._id}
                        className="flex flex-wrap items-center gap-4 px-5 py-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={
                                t.status === "done"
                                  ? "font-medium text-muted line-through"
                                  : "font-medium text-heading"
                              }
                            >
                              {t.title}
                            </span>
                            <StatusBadge status={t.priority} />
                          </div>
                          {t.description ? (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                              {t.description}
                            </p>
                          ) : null}
                        </div>

                        <span className="text-xs text-muted">
                          {formatDate(t.dueDate)}
                        </span>

                        <TaskStatusSelect taskId={t._id} status={t.status} />

                        <div className="flex items-center gap-2">
                          <TaskFormDialog
                            milestoneId={mid}
                            developerId={d._id}
                            developerName={d.name}
                            task={t}
                            minDate={minDate}
                          />
                          <DeleteTaskButton taskId={t._id} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
