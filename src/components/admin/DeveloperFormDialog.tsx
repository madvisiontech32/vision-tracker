"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError, Modal } from "./Modal";
import { api } from "@/lib/client";

const COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#22c55e",
  "#ec4899",
];

export type DeveloperValues = {
  _id?: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  color: string;
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
  const [role, setRole] = useState(developer?.role ?? "Developer");
  const [skills, setSkills] = useState((developer?.skills ?? []).join(", "));
  const [color, setColor] = useState(developer?.color ?? COLORS[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const json = { name, email, role, skills, color };
      if (editing) {
        await api(`/api/developers/${developer!._id}`, { method: "PATCH", json });
      } else {
        await api("/api/developers", { method: "POST", json });
        setName("");
        setEmail("");
        setSkills("");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

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
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@company.com"
              />
            </div>
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

          <div>
            <label className="label">Avatar colour</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  className={`h-8 w-8 cursor-pointer rounded-full transition ${
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <FormError message={error} />

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : editing ? "Save changes" : "Add developer"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
