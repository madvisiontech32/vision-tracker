"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError, Modal } from "./Modal";
import { api } from "@/lib/client";
import { toDateInput } from "@/components/ui";

export type TaskValues = {
  _id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string | null;
};

export function TaskFormDialog({
  milestoneId,
  developerId,
  developerName,
  task,
  minDate,
}: {
  milestoneId: string;
  developerId: string;
  developerName: string;
  task?: TaskValues;
  /** Earliest allowed due date (YYYY-MM-DD) - the project start date. */
  minDate?: string;
}) {
  const router = useRouter();
  const editing = Boolean(task?._id);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(toDateInput(task?.dueDate));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (minDate && dueDate && dueDate < minDate)
        throw new Error(`Due date cannot be before the project start (${minDate})`);

      const json = { title, description, status, priority, dueDate };
      if (editing) {
        await api(`/api/tasks/${task!._id}`, { method: "PATCH", json });
      } else {
        await api(`/api/milestones/${milestoneId}/tasks`, {
          method: "POST",
          json: { ...json, developer: developerId },
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
        className={editing ? "btn-ghost btn-sm" : "btn-ghost btn-sm"}
        onClick={() => setOpen(true)}
      >
        {editing ? "Edit" : "+ Add task"}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit task" : `New task for ${developerName}`}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Task title *</label>
            <input
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Build the login screen"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-24 resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any detail the client should see."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
            </div>
          </div>

          <FormError message={error} />

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : editing ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
