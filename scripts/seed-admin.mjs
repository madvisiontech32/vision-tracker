/**
 * Seeds the admin account used to sign in at /admin/login.
 *
 *   npm run seed:admin
 *
 * Idempotent: running it again updates the existing account instead of
 * creating a duplicate. Override the defaults with env vars:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing. Copy .env.example to .env.local first.");
  process.exit(1);
}

const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@project.com")
  .trim()
  .toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? "vivekVOra32*+";
const name = process.env.SEED_ADMIN_NAME ?? "Vivek Vora";

await mongoose.connect(uri);
const admins = mongoose.connection.db.collection("admins");

await admins.createIndex({ email: 1 }, { unique: true });

const now = new Date();
const passwordHash = await bcrypt.hash(password, 10);

const result = await admins.updateOne(
  { email },
  {
    $set: { name, passwordHash, active: true, updatedAt: now },
    $setOnInsert: { email, lastLoginAt: null, createdAt: now },
  },
  { upsert: true }
);

console.log(
  result.upsertedCount ? `Created admin ${email}` : `Updated admin ${email}`
);
console.log("Password stored as a bcrypt hash. Sign in at /admin/login");

await mongoose.disconnect();
