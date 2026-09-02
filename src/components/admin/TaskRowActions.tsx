"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDelete } from "./ConfirmDelete";
import { api } from "@/lib/client";

const STATUSES = ["todo", "in-progress", "review", "done"];

export function TaskStatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);

  return (
    <select
      className="input w-36 cursor-pointer py-1.5 text-xs"
      value={value}
      disabled={busy}
      onChange={async (e) => {
        const next = e.target.value;
        setValue(next);
        setBusy(true);
        try {
          await api(`/api/tasks/${taskId}`, {
            method: "PATCH",
            json: { status: next },
          });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("-", " ")}
        </option>
      ))}
    </select>
  );
}

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();

  return (
    <ConfirmDelete
      confirmLabel="Delete?"
      onConfirm={async () => {
        await api(`/api/tasks/${taskId}`, { method: "DELETE" });
        router.refresh();
      }}
    />
  );
}
