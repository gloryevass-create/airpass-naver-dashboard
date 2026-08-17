"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard/keywords", label: "네이버키워드" },
  { href: "/dashboard/blog", label: "네이버블로그" },
  { href: "/dashboard/memos", label: "광고전략메모" },
  { href: "/dashboard/news", label: "뉴스모니터링" },
  { href: "/dashboard/budget", label: "예산모니터링" },
];

function NavSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-1 border-r border-hairline p-4">
      {ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-canvas-lavender text-primary"
                : "text-ink-mute hover:bg-canvas-cream hover:text-ink"
            }`}
          >
            {item.label}
            <NavSpinner />
          </Link>
        );
      })}
    </nav>
  );
}
