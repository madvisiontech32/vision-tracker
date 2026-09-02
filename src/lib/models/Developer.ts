import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const DeveloperSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    role: { type: String, trim: true, default: "Developer" },
    skills: { type: [String], default: [] },
    color: { type: String, default: "#6b6b6b" },
    active: { type: Boolean, default: true },
    // Set by an admin. Absent means this developer cannot sign in yet.
    passwordHash: { type: String, default: "", select: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique only for developers that actually have an email; blank ones are the
// norm for people who never sign in, and must not collide with each other.
DeveloperSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $gt: "" } } }
);

export type DeveloperDoc = InferSchemaType<typeof DeveloperSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Developer =
  models.Developer || model("Developer", DeveloperSchema);
export default Developer;
