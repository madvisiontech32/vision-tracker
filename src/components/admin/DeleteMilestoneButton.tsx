"use client";

import { useRouter } from "next/navigation";
import { ConfirmDelete } from "./ConfirmDelete";
import { api } from "@/lib/client";

export function DeleteMilestoneButton({
  milestoneId,
  redirectTo,
}: {
  milestoneId: string;
  redirectTo?: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDelete
      confirmLabel="Delete for real?"
      onConfirm={async () => {
        await api(`/api/milestones/${milestoneId}`, { method: "DELETE" });
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      }}
    />
  );
}
