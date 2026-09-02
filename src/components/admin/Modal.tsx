"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // `open` is false on the first render everywhere, so reaching this branch
  // always means we are past hydration and `document` exists.
  if (!open || typeof document === "undefined") return null;

  // Rendered into <body>: any ancestor with backdrop-blur/transform becomes the
  // containing block for position:fixed, which would trap the dialog inside a card.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative my-auto w-full ${
          wide ? "max-w-2xl" : "max-w-lg"
        } rounded-2xl border border-line bg-surface p-6 shadow-2xl`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-heading">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-2 py-0.5 text-xl leading-none text-muted transition hover:bg-chip hover:text-heading"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="alert-error">
      {message}
    </p>
  );
}
