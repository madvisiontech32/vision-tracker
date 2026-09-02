import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const PROJECT_STATUSES = [
  "planning",
  "active",
  "on-hold",
  "completed",
] as const;

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: PROJECT_STATUSES, default: "planning" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Password the client types on the public site to unlock this project.
    accessPasswordHash: { type: String, required: true, select: false },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project = models.Project || model("Project", ProjectSchema);
export default Project;
