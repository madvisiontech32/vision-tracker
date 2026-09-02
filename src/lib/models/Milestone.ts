import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const MILESTONE_STATUSES = [
  "pending",
  "in-progress",
  "completed",
] as const;

const MilestoneSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: MILESTONE_STATUSES, default: "pending" },
    dueDate: { type: Date, default: null },
    order: { type: Number, default: 0 },
    developers: [{ type: Schema.Types.ObjectId, ref: "Developer" }],
  },
  { timestamps: true }
);

export type MilestoneDoc = InferSchemaType<typeof MilestoneSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Milestone = models.Milestone || model("Milestone", MilestoneSchema);
export default Milestone;
