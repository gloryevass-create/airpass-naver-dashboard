"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type IconName } from "@/components/icons/NavIcon";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard/keywords", label: "네이버키워드", icon: "search" },
  { href: "/dashboard/blog", label: "네이버블로그", icon: "document" },
  { href: "/dashboard/memos", label: "광고전략메모", icon: "clipboard" },
  { href: "/dashboard/news", label: "뉴스모니터링", icon: "newspaper" },
  { href: "/dashboard/budget", label: "공고모니터링", icon: "megaphone" },
  { href: "/dashboard/youtube", label: "유튜브채널분석", icon: "play" },
  { href: "/dashboard/events", label: "팀 일정", icon: "calendar" },
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
            <span className="flex items-center gap-2.5">
              <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </span>
            <NavSpinner />
          </Link>
        );
      })}
    </nav>
  );
}
