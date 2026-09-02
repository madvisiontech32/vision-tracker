import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/developer/TaskBoard";
import { Avatar, ProgressBar } from "@/components/ui";
import { getDeveloperWorkload } from "@/lib/queries";
import { getDeveloperSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DeveloperHomePage() {
  const session = await getDeveloperSession();
  if (!session) redirect("/developer/login");

  const { tasks, counts, total, progress } = await getDeveloperWorkload(
    session.uid
  );
  const open = total - (counts.done ?? 0);

  return (
    <>
      <section className="card mb-6 flex flex-wrap items-center gap-5 p-6">
        <Avatar name={session.name} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            {session.name}
          </h1>
          <p className="text-sm text-muted">
            {total === 0
              ? session.email
              : `${session.email} · ${open} open ${
                  open === 1 ? "task" : "tasks"
                }`}
          </p>
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

      <TaskBoard tasks={tasks} />
    </>
  );
}
