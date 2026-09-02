import { DeleteDeveloperButton } from "@/components/admin/DeleteDeveloperButton";
import { DeveloperFormDialog } from "@/components/admin/DeveloperFormDialog";
import { Avatar } from "@/components/ui";
import { getDevelopers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDevelopersPage() {
  const developers = await getDevelopers();

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">Developers</h1>
          <p className="mt-1 text-sm text-muted">
            Your team pool. Assign them to milestones from inside a project.
          </p>
        </div>
        <DeveloperFormDialog />
      </div>

      {developers.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="font-semibold text-heading">No developers yet</p>
          <p className="mt-1 text-sm text-muted">
            Add developers here first, then assign them to milestones.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map((d) => (
            <div key={d._id} className="card p-5">
              <div className="mb-4 flex items-center gap-3">
                <Avatar name={d.name} color={d.color} size={44} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-heading">{d.name}</h3>
                  <p className="truncate text-xs text-muted">{d.role}</p>
                </div>
              </div>

              {d.email ? (
                <p className="mb-3 truncate text-xs text-muted">{d.email}</p>
              ) : null}

              {d.skills.length ? (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {d.skills.map((s: string) => (
                    <span
                      key={s}
                      className="rounded-lg border border-line bg-chip px-2 py-0.5 text-[11px] text-body"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 border-t border-line pt-3">
                <DeveloperFormDialog developer={d} />
                <DeleteDeveloperButton developerId={d._id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
