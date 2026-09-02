import { DeleteDeveloperButton } from "@/components/admin/DeleteDeveloperButton";
import { DeveloperFormDialog } from "@/components/admin/DeveloperFormDialog";
import { Avatar, formatDate } from "@/components/ui";
import { getDevelopers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDevelopersPage() {
  const developers = await getDevelopers();
  const lockedOut = developers.filter((d) => !d.canLogin).length;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            Developers
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your team pool. Each one signs in at /developer with the email and
            password you set here.
          </p>
        </div>
        <DeveloperFormDialog />
      </div>

      {lockedOut > 0 ? (
        <p className="mb-5 rounded-xl border border-line2 bg-chip px-4 py-3 text-sm text-body">
          {`${lockedOut} ${
            lockedOut === 1 ? "developer has" : "developers have"
          } no password yet and cannot sign in. Edit them to set one.`}
        </p>
      ) : null}

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
            <div key={d._id} className="card flex flex-col p-5">
              <div className="mb-4 flex items-center gap-3">
                <Avatar name={d.name} color={d.color} size={44} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-heading">
                    {d.name}
                  </h3>
                  <p className="truncate text-xs text-muted">{d.role}</p>
                </div>
              </div>

              <p className="mb-3 truncate text-xs text-muted">
                {d.email || "No login email"}
              </p>

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

              <div className="mt-auto">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`badge ${d.canLogin ? "badge-good" : "badge-danger"}`}
                  >
                    {d.canLogin ? "can sign in" : "no password"}
                  </span>
                  {d.lastLoginAt ? (
                    <span className="text-[11px] text-muted">
                      {`last seen ${formatDate(d.lastLoginAt)}`}
                    </span>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t border-line pt-3">
                  <DeveloperFormDialog developer={d} />
                  <DeleteDeveloperButton developerId={d._id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
