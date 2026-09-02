import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted">
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 ? <span className="text-muted/50">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="link-muted">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-heading">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
