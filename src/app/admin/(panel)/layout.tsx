import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAdminSession } from "@/lib/session";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const session = await getAdminSession();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent text-sm font-black text-brand-fg">
              VT
            </span>
            <span className="text-[15px] font-bold tracking-tight text-heading">
              Vision Tracker
            </span>
          </Link>

          <AdminNav />

          <div className="flex items-center gap-3">
            {session?.email ? (
              <span className="hidden text-xs text-muted sm:inline">
                {session.email}
              </span>
            ) : null}
            <Link href="/" target="_blank" className="btn-ghost btn-sm">
              View site
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
