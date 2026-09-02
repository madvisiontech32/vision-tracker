import { NextResponse } from "next/server";
import { isAdmin } from "./session";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Returns a 401 response when the caller is not an authenticated admin. */
export async function guardAdmin() {
  if (!(await isAdmin())) return fail("Unauthorized", 401);
  return null;
}

export function isValidObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

/** Date-only key (YYYY-MM-DD) for anything date-ish; "" when absent/invalid. */
export function dayKey(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** True when `value` falls on a day before `floor` (both date-ish, day precision). */
export function isBeforeDay(value: unknown, floor: unknown): boolean {
  const a = dayKey(value);
  const b = dayKey(floor);
  if (!a || !b) return false;
  return a < b;
}
