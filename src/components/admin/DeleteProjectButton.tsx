"use client";

import { useRouter } from "next/navigation";
import { ConfirmDelete } from "./ConfirmDelete";
import { api } from "@/lib/client";

export function DeleteProjectButton({
  projectId,
  redirectTo,
}: {
  projectId: string;
  redirectTo?: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDelete
      label="Delete"
      confirmLabel="Delete for real?"
      onConfirm={async () => {
        await api(`/api/projects/${projectId}`, { method: "DELETE" });
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      }}
    />
  );
}
