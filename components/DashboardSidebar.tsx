"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard/keywords", label: "네이버키워드" },
  { href: "/dashboard/blog", label: "네이버블로그" },
];

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
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-canvas-lavender text-primary"
                : "text-ink-mute hover:bg-canvas-cream hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
