"use client";

import { useState } from "react";

export function ConfirmDelete({
  onConfirm,
  label = "Delete",
  confirmLabel = "Sure?",
  className = "btn-danger btn-sm",
}: {
  onConfirm: () => Promise<void> | void;
  label?: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 4000);
          return;
        }
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
    >
      {busy ? "..." : armed ? confirmLabel : label}
    </button>
  );
}
