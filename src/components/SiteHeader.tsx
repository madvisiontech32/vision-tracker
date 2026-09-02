import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent text-sm font-black text-brand-fg">
            VT
          </span>
          <span className="text-[15px] font-bold tracking-tight text-heading">
            Vision&nbsp;Tracker
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line py-6">
      <p className="mx-auto max-w-6xl px-5 text-xs text-muted">
        Vision Tracker — client portal. Milestone and task data is read-only here.
      </p>
    </footer>
  );
}
