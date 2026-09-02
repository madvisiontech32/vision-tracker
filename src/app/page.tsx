import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { EmptyState, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { getPublicProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getPublicProjects();

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <section className="mb-10">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-chip px-3 py-1 text-xs font-medium text-body">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Client portal
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Track every milestone of your project
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Pick your project below and unlock it with the password your project
            manager shared. Inside, hover a milestone to reveal its team, then
            hover a developer to see their tasks.
          </p>
        </section>

        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-heading">All projects</h2>
          <span className="text-sm text-muted">
            {`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
          </span>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects published yet"
            hint="Once an admin creates a project it will show up here for clients to open."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p._id}
                href={`/projects/${p._id}`}
                className="card card-hover group flex flex-col p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-base leading-snug font-semibold text-heading underline-offset-4 group-hover:underline">
                    {p.name}
                  </h3>
                  <StatusBadge status={p.status} />
                </div>

                {p.client ? (
                  <p className="mb-2 text-xs tracking-wide text-muted uppercase">
                    {p.client}
                  </p>
                ) : null}

                <p className="mb-5 line-clamp-2 text-sm text-muted">
                  {p.description || "No description provided."}
                </p>

                <div className="mt-auto space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-muted">
                      <span>Progress</span>
                      <span className="font-semibold text-heading">
                        {`${p.progress}%`}
                      </span>
                    </div>
                    <ProgressBar value={p.progress} />
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                    <span>
                      {`${p.milestoneCount} milestones · ${p.taskCount} tasks`}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <rect x="4" y="10" width="16" height="10" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                      {formatDate(p.endDate)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
