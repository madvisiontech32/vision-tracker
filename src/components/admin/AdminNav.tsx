"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/developers", label: "Developers" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 rounded-xl border border-line bg-chip p-1 md:flex">
      {LINKS.map((l) => {
        const active =
          l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-brand-500 text-brand-fg shadow shadow-black/10"
                : "text-body hover:text-heading"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
