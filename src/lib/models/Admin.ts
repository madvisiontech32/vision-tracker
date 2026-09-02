import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const AdminSchema = new Schema(
  {
    name: { type: String, trim: true, default: "Administrator" },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // bcrypt hash; never selected unless explicitly asked for.
    passwordHash: { type: String, required: true, select: false },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type AdminDoc = InferSchemaType<typeof AdminSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Admin = models.Admin || model("Admin", AdminSchema);
export default Admin;
