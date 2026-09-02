"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function ProjectOrderButtons({
  ids,
  index,
}: {
  /** Every project id, in the order currently displayed. */
  ids: string[];
  index: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const first = index === 0;
  const last = index === ids.length - 1;

  async function move(delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= ids.length || busy) return;

    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];

    setBusy(true);
    try {
      await api("/api/projects/reorder", { method: "PATCH", json: { ids: next } });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className="mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-chip text-[11px] font-bold text-muted"
        title={`Position ${index + 1} of ${ids.length}`}
      >
        {index + 1}
      </span>

      <button
        type="button"
        onClick={() => move(-1)}
        disabled={busy || first}
        aria-label="Move up"
        title="Move up"
        className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-line bg-chip text-muted transition hover:border-line2 hover:text-heading disabled:cursor-not-allowed disabled:opacity-35"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => move(1)}
        disabled={busy || last}
        aria-label="Move down"
        title="Move down"
        className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-line bg-chip text-muted transition hover:border-line2 hover:text-heading disabled:cursor-not-allowed disabled:opacity-35"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
