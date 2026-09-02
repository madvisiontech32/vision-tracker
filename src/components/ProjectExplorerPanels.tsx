"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Avatar, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import type { Milestone, Tree } from "./explorer-types";

export function Explorer({ tree, onLock }: { tree: Tree; onLock: () => void }) {
  const { project, milestones } = tree;

  const [milestoneId, setMilestoneId] = useState(milestones[0]?._id ?? "");
  const [developerId, setDeveloperId] = useState(
    milestones[0]?.developers[0]?._id ?? ""
  );

  const milestone = useMemo(
    () => milestones.find((m) => m._id === milestoneId) ?? milestones[0],
    [milestones, milestoneId]
  );

  const developer = useMemo(() => {
    if (!milestone) return undefined;
    return (
      milestone.developers.find((d) => d._id === developerId) ??
      milestone.developers[0]
    );
  }, [milestone, developerId]);

  // Hovering a milestone also moves the task panel to the first developer of
  // that milestone, so the three columns always agree with each other.
  function pickMilestone(m: Milestone) {
    if (m._id === milestoneId) return;
    setMilestoneId(m._id);
    setDeveloperId(m.developers[0]?._id ?? "");
  }

  return (
    <>
      <section className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-heading">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            {project.client ? (
              <p className="text-sm text-muted">{`Client — ${project.client}`}</p>
            ) : null}
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={onLock}>
            Lock
          </button>
        </div>

        {project.description ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-body">
            {project.description}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Fact label="Start" value={formatDate(project.startDate)} />
          <Fact label="Target end" value={formatDate(project.endDate)} />
          <Fact label="Milestones" value={String(milestones.length)} />
          <Fact
            label="Tasks"
            value={`${project.doneCount}/${project.taskCount} done`}
          />
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span>Overall progress</span>
            <span className="font-semibold text-heading">
              {`${project.progress}%`}
            </span>
          </div>
          <ProgressBar value={project.progress} />
        </div>
      </section>

      {milestones.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-semibold text-heading">No milestones yet</p>
          <p className="mt-1 text-sm text-muted">
            Your project manager has not added milestones to this project.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            Hover a milestone to see its team, then hover a developer to see
            their tasks. On touch screens, tap instead.
          </p>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
            <Column title="Milestones" count={milestones.length}>
              {milestones.map((m, i) => {
                const active = m._id === milestone?._id;
                return (
                  <button
                    key={m._id}
                    type="button"
                    onPointerEnter={() => pickMilestone(m)}
                    onFocus={() => pickMilestone(m)}
                    onClick={() => pickMilestone(m)}
                    className={`w-full cursor-pointer rounded-xl border p-3.5 text-left transition ${
                      active
                        ? "border-brand-500/60 bg-brand-500/10"
                        : "border-transparent hover:border-line hover:bg-chip"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                          active
                            ? "bg-brand-500 text-brand-fg"
                            : "bg-chip text-muted"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-heading">
                            {m.title}
                          </span>
                          <StatusBadge status={m.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {`${m.developers.length} ${
                            m.developers.length === 1
                              ? "developer"
                              : "developers"
                          } · ${m.doneCount}/${m.taskCount} tasks · due ${formatDate(
                            m.dueDate
                          )}`}
                        </p>
                        <div className="mt-2.5">
                          <ProgressBar value={m.progress} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </Column>

            <Column
              title="Team"
              subtitle={milestone?.title}
              count={milestone?.developers.length ?? 0}
            >
              {milestone && milestone.developers.length > 0 ? (
                milestone.developers.map((d) => {
                  const active = d._id === developer?._id;
                  return (
                    <button
                      key={d._id}
                      type="button"
                      onPointerEnter={() => setDeveloperId(d._id)}
                      onFocus={() => setDeveloperId(d._id)}
                      onClick={() => setDeveloperId(d._id)}
                      className={`w-full cursor-pointer rounded-xl border p-3.5 text-left transition ${
                        active
                          ? "border-brand-500/60 bg-brand-500/10"
                          : "border-transparent hover:border-line hover:bg-chip"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={d.name} color={d.color} size={38} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-heading">
                            {d.name}
                          </p>
                          <p className="truncate text-xs text-muted">{d.role}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {`${d.doneCount}/${d.taskCount}`}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <ProgressBar value={d.progress} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <Placeholder text="No developers on this milestone yet." />
              )}
            </Column>

            <Column
              title="Tasks"
              subtitle={developer?.name}
              count={developer?.tasks.length ?? 0}
            >
              {developer && developer.tasks.length > 0 ? (
                developer.tasks.map((t) => (
                  <div
                    key={t._id}
                    className="rounded-xl border border-line bg-canvas p-3.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p
                        className={
                          t.status === "done"
                            ? "font-semibold text-muted line-through"
                            : "font-semibold text-heading"
                        }
                      >
                        {t.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <StatusBadge status={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                    {t.description ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-body">
                        {t.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted">
                      {`Due ${formatDate(t.dueDate)}`}
                    </p>
                  </div>
                ))
              ) : (
                <Placeholder
                  text={
                    developer
                      ? `No tasks assigned to ${developer.name} here yet.`
                      : "Pick a developer to see their tasks."
                  }
                />
              )}
            </Column>
          </div>
        </>
      )}
    </>
  );
}

function Column({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-wide text-heading uppercase">
            {title}
          </h2>
          {subtitle ? (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-xs font-semibold text-muted">
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-1.5 p-2.5">{children}</div>
    </section>
  );
}

function Placeholder({ text }: { text: string }) {
  return <p className="px-3 py-10 text-center text-sm text-muted">{text}</p>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-semibold text-heading">{value}</p>
    </div>
  );
}
