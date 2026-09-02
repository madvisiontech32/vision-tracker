"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui";
import { api } from "@/lib/client";

type Dev = { _id: string; name: string; role: string; color: string };

export function AssignDevelopers({
  milestoneId,
  assigned,
  pool,
}: {
  milestoneId: string;
  assigned: Dev[];
  pool: Dev[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const assignedIds = new Set(assigned.map((d) => d._id));
  const available = pool.filter((d) => !assignedIds.has(d._id));

  async function add(developerId: string) {
    setBusy(developerId);
    setError("");
    try {
      await api(`/api/milestones/${milestoneId}/developers`, {
        method: "POST",
        json: { developerId },
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign");
    } finally {
      setBusy("");
    }
  }

  async function remove(developerId: string) {
    setBusy(developerId);
    setError("");
    try {
      await api(
        `/api/milestones/${milestoneId}/developers?developerId=${developerId}`,
        { method: "DELETE" }
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-heading">Developers on this milestone</h2>
      <p className="mt-0.5 mb-4 text-sm text-muted">
        Only assigned developers can receive tasks here.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {assigned.length === 0 ? (
          <p className="text-sm text-muted">Nobody assigned yet.</p>
        ) : (
          assigned.map((d) => (
            <span
              key={d._id}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-chip py-1 pr-2 pl-1"
            >
              <Avatar name={d.name} color={d.color} size={26} />
              <span className="text-sm font-medium text-heading">{d.name}</span>
              <button
                type="button"
                aria-label={`Remove ${d.name}`}
                disabled={busy === d._id}
                onClick={() => remove(d._id)}
                className="cursor-pointer rounded-full px-1.5 text-muted transition hover:bg-danger-bg hover:text-danger"
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>

      <div className="border-t border-line pt-4">
        <p className="label">Add a developer</p>
        {available.length === 0 ? (
          <p className="text-sm text-muted">
            Everyone in your team pool is already on this milestone.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((d) => (
              <button
                key={d._id}
                type="button"
                disabled={busy === d._id}
                onClick={() => add(d._id)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-chip py-1 pr-3 pl-1 transition hover:border-line2 hover:bg-surface2"
              >
                <Avatar name={d.name} color={d.color} size={24} />
                <span className="text-sm text-body">{d.name}</span>
                <span className="text-xs font-bold text-heading">+</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error ? (
        <p className="alert-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
