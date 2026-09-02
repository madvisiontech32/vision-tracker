import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const TASK_STATUSES = ["todo", "in-progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;

const TaskSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    milestone: {
      type: Schema.Types.ObjectId,
      ref: "Milestone",
      required: true,
      index: true,
    },
    developer: {
      type: Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: TASK_STATUSES, default: "todo" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium" },
    dueDate: { type: Date, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type TaskDoc = InferSchemaType<typeof TaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Task = models.Task || model("Task", TaskSchema);
export default Task;
