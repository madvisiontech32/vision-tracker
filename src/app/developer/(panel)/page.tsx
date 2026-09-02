import { redirect } from "next/navigation";
import { TaskStatusControl } from "@/components/developer/TaskStatusControl";
import {
  Avatar,
  EmptyState,
  ProgressBar,
  StatusBadge,
  formatDate,
} from "@/components/ui";
import { getDeveloperWorkload } from "@/lib/queries";
import { getDeveloperSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const STAT_LABELS: [string, string][] = [
  ["todo", "To do"],
  ["in-progress", "In progress"],
  ["review", "Review"],
  ["done", "Done"],
];

export default async function DeveloperHomePage() {
  const session = await getDeveloperSession();
  if (!session) redirect("/developer/login");

  const { tasks, counts, total, progress } = await getDeveloperWorkload(
    session.uid
  );

  // Grouped by project, then by milestone, keeping the due-date order the
  // query already produced.
  const groups = new Map<string, Map<string, typeof tasks>>();
  for (const t of tasks) {
    if (!groups.has(t.projectName)) groups.set(t.projectName, new Map());
    const byMilestone = groups.get(t.projectName)!;
    if (!byMilestone.has(t.milestoneTitle)) byMilestone.set(t.milestoneTitle, []);
    byMilestone.get(t.milestoneTitle)!.push(t);
  }

  const open = total - (counts.done ?? 0);

  return (
    <>
      <section className="card mb-6 flex flex-wrap items-center gap-5 p-6">
        <Avatar name={session.name} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            {session.name}
          </h1>
          <p className="text-sm text-muted">{session.email}</p>
        </div>
        <div className="w-full sm:w-56">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>
              {total === 0
                ? "Nothing assigned"
                : `${counts.done ?? 0} of ${total} done`}
            </span>
            <span className="font-semibold text-heading">{`${progress}%`}</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </section>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="card px-5 py-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-heading">
              {counts[key] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-heading">My tasks</h2>
        <p className="text-sm text-muted">
          {total === 0
            ? "Nothing here yet"
            : `${open} open · pick a status to move a task along`}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          title="No tasks assigned to you"
          hint="Once an admin adds you to a milestone and assigns work, it shows up here."
        />
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([projectName, byMilestone]) => (
            <section key={projectName} className="card overflow-hidden">
              <header className="border-b border-line px-5 py-3.5">
                <h3 className="font-bold text-heading">{projectName}</h3>
                <p className="text-xs text-muted">
                  {`${[...byMilestone.values()].flat().length} tasks across ${
                    byMilestone.size
                  } ${byMilestone.size === 1 ? "milestone" : "milestones"}`}
                </p>
              </header>

              {[...byMilestone.entries()].map(([milestoneTitle, items]) => (
                <div key={milestoneTitle}>
                  <p className="border-b border-line bg-chip px-5 py-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    {milestoneTitle}
                    {items[0]?.milestoneDue
                      ? ` · due ${formatDate(items[0].milestoneDue)}`
                      : ""}
                  </p>

                  <ul className="divide-y divide-line">
                    {items.map((t) => (
                      <li
                        key={t._id}
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={
                                t.status === "done"
                                  ? "font-semibold text-muted line-through"
                                  : "font-semibold text-heading"
                              }
                            >
                              {t.title}
                            </span>
                            <StatusBadge status={t.priority} />
                          </div>
                          {t.description ? (
                            <p className="mt-1 text-sm leading-relaxed text-body">
                              {t.description}
                            </p>
                          ) : null}
                          <p className="mt-1.5 text-xs text-muted">
                            {`Due ${formatDate(t.dueDate)}`}
                          </p>
                        </div>

                        <TaskStatusControl taskId={t._id} status={t.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
