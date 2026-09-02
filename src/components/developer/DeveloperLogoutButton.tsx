"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeveloperLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="btn-ghost btn-sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/developer/logout", { method: "POST" });
        router.replace("/developer/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
