"use client";

import { useMemo, useState } from "react";
import { TaskStatusControl } from "./TaskStatusControl";
import { EmptyState, StatusBadge, formatDate } from "@/components/ui";

export type BoardTask = {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName: string;
  milestoneTitle: string;
  milestoneDue: string | null;
};

const FILTERS: { value: string; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

/** Open work is what a developer needs on screen; finished work is opt-in. */
const DEFAULT_STATUSES = ["todo", "in-progress"];

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const [active, setActive] = useState<string[]>(DEFAULT_STATUSES);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tasks) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [tasks]);

  const visible = useMemo(
    () => tasks.filter((t) => active.includes(t.status)),
    [tasks, active]
  );

  // Grouped by project, then milestone, keeping the due-date order the server
  // already produced.
  const groups = useMemo(() => {
    const byProject = new Map<string, Map<string, BoardTask[]>>();
    for (const t of visible) {
      if (!byProject.has(t.projectName)) byProject.set(t.projectName, new Map());
      const byMilestone = byProject.get(t.projectName)!;
      if (!byMilestone.has(t.milestoneTitle))
        byMilestone.set(t.milestoneTitle, []);
      byMilestone.get(t.milestoneTitle)!.push(t);
    }
    return byProject;
  }, [visible]);

  function toggle(value: string) {
    setActive((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  }

  const isDefault =
    active.length === DEFAULT_STATUSES.length &&
    DEFAULT_STATUSES.every((s) => active.includes(s));

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FILTERS.map((f) => {
          const on = active.includes(f.value);
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => toggle(f.value)}
              aria-pressed={on}
              className={`card cursor-pointer px-5 py-4 text-left transition ${
                on
                  ? "border-line2 bg-surface2"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  {f.label}
                </p>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    on ? "bg-brand-500" : "bg-transparent ring-1 ring-line2"
                  }`}
                />
              </div>
              <p className="mt-1 text-2xl font-bold text-heading">
                {counts[f.value] ?? 0}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-heading">My tasks</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">
            {`Showing ${visible.length} of ${tasks.length}`}
          </p>
          {isDefault ? null : (
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setActive(DEFAULT_STATUSES)}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {active.length === 0 ? (
        <EmptyState
          title="No status selected"
          hint="Pick at least one status above to see your tasks."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          hint={
            tasks.length === 0
              ? "Once an admin adds you to a milestone and assigns work, it shows up here."
              : "No tasks match the statuses you selected. Try turning another one on."
          }
        />
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([projectName, byMilestone]) => (
            <section key={projectName} className="card overflow-hidden">
              <header className="border-b border-line px-5 py-3.5">
                <h3 className="font-bold text-heading">{projectName}</h3>
                <p className="text-xs text-muted">
                  {`${[...byMilestone.values()].flat().length} shown across ${
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
