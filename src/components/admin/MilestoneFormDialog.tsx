"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError, Modal } from "./Modal";
import { api } from "@/lib/client";
import { toDateInput } from "@/components/ui";

export type MilestoneValues = {
  _id?: string;
  title: string;
  description: string;
  status: string;
  dueDate?: string | null;
};

export function MilestoneFormDialog({
  projectId,
  milestone,
  minDate,
}: {
  projectId: string;
  milestone?: MilestoneValues;
  /** Earliest allowed due date (YYYY-MM-DD) - the project start date. */
  minDate?: string;
}) {
  const router = useRouter();
  const editing = Boolean(milestone?._id);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [status, setStatus] = useState(milestone?.status ?? "pending");
  const [dueDate, setDueDate] = useState(toDateInput(milestone?.dueDate));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (minDate && dueDate && dueDate < minDate)
        throw new Error(`Due date cannot be before the project start (${minDate})`);

      const json = { title, description, status, dueDate };
      if (editing) {
        await api(`/api/milestones/${milestone!._id}`, { method: "PATCH", json });
      } else {
        await api(`/api/projects/${projectId}/milestones`, {
          method: "POST",
          json,
        });
        setTitle("");
        setDescription("");
        setDueDate("");
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
        {editing ? "Edit" : "+ Add milestone"}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit milestone" : "Add milestone"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Milestone title *</label>
            <input
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Phase 1 - UI design"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-24 resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What gets delivered in this milestone?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                type="date"
                className="input"
                min={minDate || undefined}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              {minDate ? (
                <p className="mt-1.5 text-xs text-muted">
                  Not before {minDate}
                </p>
              ) : null}
            </div>
          </div>

          <FormError message={error} />

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : editing ? "Save changes" : "Add milestone"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
