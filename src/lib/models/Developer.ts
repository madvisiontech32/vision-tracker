import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const DeveloperSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    role: { type: String, trim: true, default: "Developer" },
    skills: { type: [String], default: [] },
    color: { type: String, default: "#6b6b6b" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type DeveloperDoc = InferSchemaType<typeof DeveloperSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Developer =
  models.Developer || model("Developer", DeveloperSchema);
export default Developer;
