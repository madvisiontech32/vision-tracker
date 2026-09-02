"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError, Modal } from "./Modal";
import { api } from "@/lib/client";
import { toDateInput } from "@/components/ui";

export type ProjectFormValues = {
  _id?: string;
  name: string;
  client: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  visible: boolean;
};

const EMPTY: ProjectFormValues = {
  name: "",
  client: "",
  description: "",
  status: "planning",
  startDate: "",
  endDate: "",
  visible: true,
};

export function ProjectFormDialog({
  project,
  trigger,
}: {
  project?: Partial<ProjectFormValues> & { _id?: string };
  trigger?: string;
}) {
  const router = useRouter();
  const editing = Boolean(project?._id);

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ProjectFormValues>({
    ...EMPTY,
    ...project,
    startDate: toDateInput(project?.startDate),
    endDate: toDateInput(project?.endDate),
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K]
  ) => setValues((v) => ({ ...v, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { ...values };
      if (password) payload.password = password;
      if (!editing && !password) throw new Error("Set a client access password");
      if (values.startDate && values.endDate && values.endDate < values.startDate)
        throw new Error("Target end date cannot be before the start date");

      if (editing) {
        await api(`/api/projects/${project!._id}`, {
          method: "PATCH",
          json: payload,
        });
      } else {
        await api("/api/projects", { method: "POST", json: payload });
      }

      setOpen(false);
      setPassword("");
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
        {trigger ?? (editing ? "Edit" : "+ New project")}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit project" : "Create project"}
        wide
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Project name *</label>
              <input
                className="input"
                required
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Acme mobile app"
              />
            </div>
            <div>
              <label className="label">Client name</label>
              <input
                className="input"
                value={values.client}
                onChange={(e) => set("client", e.target.value)}
                placeholder="Acme Pvt Ltd"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-24 resize-y"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this project about?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={values.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Start date</label>
              <input
                type="date"
                className="input"
                value={values.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Target end</label>
              <input
                type="date"
                className="input"
                min={values.startDate || undefined}
                value={values.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-4">
            <label className="label mb-1">
              Client access password {editing ? "(leave blank to keep)" : "*"}
            </label>
            <input
              type="text"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editing ? "Set a new password" : "Min 4 characters"}
              autoComplete="off"
            />
            <p className="mt-2 text-xs text-muted">
              Share this with the client. They type it on the public site to open
              this project.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-body">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand-500)]"
              checked={values.visible}
              onChange={(e) => set("visible", e.target.checked)}
            />
            Show this project on the public home page
          </label>

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
              {busy ? "Saving..." : editing ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
