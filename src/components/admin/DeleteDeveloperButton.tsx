"use client";

import { useRouter } from "next/navigation";
import { ConfirmDelete } from "./ConfirmDelete";
import { api } from "@/lib/client";

export function DeleteDeveloperButton({ developerId }: { developerId: string }) {
  const router = useRouter();

  return (
    <ConfirmDelete
      confirmLabel="Delete for real?"
      onConfirm={async () => {
        await api(`/api/developers/${developerId}`, { method: "DELETE" });
        router.refresh();
      }}
    />
  );
}
