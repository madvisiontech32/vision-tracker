"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError, Modal } from "./Modal";
import { api } from "@/lib/client";

// Shades, not hues: the UI is monochrome, so the picker offers the same grey
// band the avatars actually render in.
const SHADES = [
  "#4a4a4a",
  "#5a5a5a",
  "#6b6b6b",
  "#7c7c7c",
  "#8d8d8d",
  "#9e9e9e",
  "#afafaf",
  "#c0c0c0",
];

const MIN_PASSWORD = 6;

export type DeveloperValues = {
  _id?: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  color: string;
  canLogin?: boolean;
};

export function DeveloperFormDialog({
  developer,
}: {
  developer?: DeveloperValues;
}) {
  const router = useRouter();
  const editing = Boolean(developer?._id);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(developer?.name ?? "");
  const [email, setEmail] = useState(developer?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(developer?.role ?? "Developer");
  const [skills, setSkills] = useState((developer?.skills ?? []).join(", "));
  const [color, setColor] = useState(developer?.color ?? SHADES[2]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!editing && password.length < MIN_PASSWORD)
        throw new Error(`Password must be at least ${MIN_PASSWORD} characters`);

      const json: Record<string, unknown> = { name, email, role, skills, color };
      if (password) json.password = password;

      if (editing) {
        await api(`/api/developers/${developer!._id}`, { method: "PATCH", json });
      } else {
        await api("/api/developers", { method: "POST", json });
        setName("");
        setEmail("");
        setSkills("");
      }
      setPassword("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const needsPassword = editing && developer?.canLogin === false;

  return (
    <>
      <button
        type="button"
        className={editing ? "btn-ghost btn-sm" : "btn-primary"}
        onClick={() => setOpen(true)}
      >
        {editing ? "Edit" : "+ Add developer"}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit developer" : "Add developer"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rahul Sharma"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Role</label>
              <input
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Frontend Developer"
              />
            </div>
            <div>
              <label className="label">Skills (comma separated)</label>
              <input
                className="input"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Next.js, MongoDB"
              />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-chip p-4">
            <p className="mb-3 text-xs font-semibold tracking-wide text-heading uppercase">
              Login for /developer
            </p>

            {needsPassword ? (
              <p className="mb-3 rounded-lg border border-line2 bg-surface px-3 py-2 text-xs text-body">
                This developer has no password yet and cannot sign in. Set one
                below.
              </p>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="label">Login email *</label>
                <input
                  type="email"
                  className="input"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@company.com"
                />
              </div>

              <div>
                <label className="label">
                  {editing ? "Password (leave blank to keep)" : "Password *"}
                </label>
                <input
                  type="text"
                  className="input"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    editing
                      ? "Set a new password"
                      : `At least ${MIN_PASSWORD} characters`
                  }
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted">
              Share these with the developer. They sign in at /developer to see
              their tasks and move them along.
            </p>
          </div>

          <div>
            <label className="label">Avatar shade</label>
            <div className="flex flex-wrap gap-2">
              {SHADES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Shade ${c}`}
                  className={`h-8 w-8 cursor-pointer rounded-full transition ${
                    color === c
                      ? "ring-2 ring-heading ring-offset-2 ring-offset-surface"
                      : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <FormError message={error} />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Add developer"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
