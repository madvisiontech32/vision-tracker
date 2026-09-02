"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { api } from "@/lib/client";

const STEPS = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export function TaskStatusControl({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  // Optimistic: the segment highlights immediately, then the server confirms.
  const [value, setValue] = useState(status);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  async function move(next: string) {
    if (next === value || saving) return;
    const previous = value;
    setValue(next);
    setError("");
    setSaving(true);
    try {
      await api(`/api/developer/tasks/${taskId}`, {
        method: "PATCH",
        json: { status: next },
      });
      startTransition(() => router.refresh());
    } catch (err) {
      setValue(previous);
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <div
        role="group"
        aria-label="Task status"
        className="flex flex-wrap gap-1 rounded-xl border border-line bg-chip p-1"
      >
        {STEPS.map((s) => {
          const active = s.value === value;
          return (
            <button
              key={s.value}
              type="button"
              disabled={saving || pending}
              onClick={() => move(s.value)}
              aria-pressed={active}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                active
                  ? "bg-brand-500 text-brand-fg"
                  : "text-muted hover:text-heading"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
