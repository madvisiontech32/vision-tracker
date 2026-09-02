import type { ReactNode } from "react";

const STATUS_TIERS: Record<string, string> = {
  // project
  planning: "badge-info",
  active: "badge-good",
  "on-hold": "badge-warn",
  completed: "badge-brand",
  // milestone
  pending: "badge-neutral",
  "in-progress": "badge-warn",
  // task
  todo: "badge-neutral",
  review: "badge-info",
  done: "badge-good",
  // priority
  low: "badge-neutral",
  medium: "badge-info",
  high: "badge-danger",
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const tier = STATUS_TIERS[status] ?? "badge-neutral";
  return (
    <span className={`badge ${tier} ${className}`}>
      {status.replace("-", " ")}
    </span>
  );
}

export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-chip ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Developer colours are arbitrary hex values from the database, but the UI is
 * monochrome. Map each one onto a narrow grey band by its luminance: avatars
 * still differ per developer, and the white initials always clear 4.5:1 on
 * both the light and the dark surface.
 */
function avatarGreys(hex: string): [string, string] {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);

  const channel = (i: number) => parseInt(full.slice(i, i + 2), 16) || 0;
  const luminance =
    (0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)) / 255;

  const base = Math.round((0.28 + luminance * 0.14) * 255);
  const grey = (v: number) => `rgb(${v} ${v} ${v})`;
  return [grey(base), grey(Math.max(0, base - 26))];
}

export function Avatar({
  name,
  color = "#6b6b6b",
  size = 36,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const [from, to] = avatarGreys(color);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: size * 0.36,
      }}
    >
      {initials || "?"}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  icon = "○",
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="text-3xl text-muted/50">{icon}</div>
      <p className="font-semibold text-heading">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-heading">{value}</p>
    </div>
  );
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toDateInput(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Today as a YYYY-MM-DD string, for `min` on date inputs. */
export function todayInput() {
  return toDateInput(new Date());
}
