import Link from "next/link";
import { DeveloperLogoutButton } from "@/components/developer/DeveloperLogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getDeveloperSession } from "@/lib/session";

export default async function DeveloperPanelLayout({
  children,
}: LayoutProps<"/developer">) {
  const session = await getDeveloperSession();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href="/developer" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent text-sm font-black text-brand-fg">
              VT
            </span>
            <span className="text-[15px] font-bold tracking-tight text-heading">
              My Work
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {session?.name ? (
              <span className="hidden text-xs text-muted sm:inline">
                {session.name}
              </span>
            ) : null}
            <ThemeToggle />
            <DeveloperLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
