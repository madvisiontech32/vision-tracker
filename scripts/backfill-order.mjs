/**
 * One-off: give every project a display position.
 *
 * `order` was added after some projects already existed, and a document that
 * simply lacks the field sorts before 0 in MongoDB - so those projects pinned
 * themselves to the top of the list and the admin arrows could not settle.
 * This assigns positions to anything missing one, keeping the current order.
 *
 *   node --env-file=.env.local  scripts/backfill-order.mjs
 *   node --env-file=.env.atlas  scripts/backfill-order.mjs
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing.");
  process.exit(1);
}

await mongoose.connect(uri);
const projects = mongoose.connection.db.collection("projects");

const all = await projects
  .find({}, { projection: { name: 1, order: 1, createdAt: 1 } })
  .sort({ order: 1, createdAt: -1 })
  .toArray();

const writes = all
  .map((p, order) => ({ p, order }))
  .filter(({ p, order }) => p.order !== order)
  .map(({ p, order }) => ({
    updateOne: { filter: { _id: p._id }, update: { $set: { order } } },
  }));

if (writes.length) await projects.bulkWrite(writes);

console.log(`${all.length} projects, ${writes.length} repositioned:\n`);
for (const [i, p] of all.entries()) {
  const had = p.order === undefined ? "(none)" : String(p.order);
  console.log(`  ${String(i).padStart(2)}  ${p.name.padEnd(34)} was ${had}`);
}

await mongoose.disconnect();
