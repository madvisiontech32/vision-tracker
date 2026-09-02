"use client";

import { useState, type FormEvent } from "react";
import { Explorer } from "./ProjectExplorerPanels";
import type { Tree } from "./explorer-types";
import { api } from "@/lib/client";

export function ProjectExplorer({
  projectId,
  projectName,
  clientName,
}: {
  projectId: string;
  projectName: string;
  clientName?: string;
}) {
  const [tree, setTree] = useState<Tree | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      // Nothing is persisted: the tree lives in this component only, so leaving
      // the page and coming back always asks for the password again.
      const data = await api<Tree>(`/api/projects/${projectId}/unlock`, {
        method: "POST",
        json: { password },
      });
      setTree(data);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock");
    } finally {
      setBusy(false);
    }
  }

  if (tree) return <Explorer tree={tree} onLock={() => setTree(null)} />;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-500">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-heading">{projectName}</h1>
          <p className="mt-1 text-sm text-muted">
            {clientName ? `${clientName} — ` : ""}
            Enter the access password shared by your project manager.
          </p>
        </div>

        <form onSubmit={unlock} className="space-y-4">
          <div>
            <label className="label" htmlFor="access-password">
              Access password
            </label>
            <input
              id="access-password"
              type="password"
              autoFocus
              autoComplete="off"
              className="input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p className="alert-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || !password}
          >
            {busy ? "Checking…" : "Unlock project"}
          </button>

          <p className="text-center text-xs text-muted">
            Asked on every visit — nothing is remembered on this device.
          </p>
        </form>
      </div>
    </div>
  );
}
