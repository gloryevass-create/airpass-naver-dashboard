"use client";

import type { SVGProps } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

type IconName = "search" | "document" | "clipboard" | "newspaper" | "megaphone" | "play";

function NavIcon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "search":
      return (
        <svg {...shared} {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "document":
      return (
        <svg {...shared} {...props}>
          <path d="M7 3h6l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M13 3v5h5" />
          <path d="M9 13h6M9 17h6" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...shared} {...props}>
          <rect x="6" y="4" width="12" height="17" rx="2" />
          <path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" />
          <path d="M9 11h6M9 15h6" />
        </svg>
      );
    case "newspaper":
      return (
        <svg {...shared} {...props}>
          <rect x="3" y="5" width="13" height="15" rx="1" />
          <path d="M16 8h3.5a.5.5 0 0 1 .5.5V18a2 2 0 0 1-2 2H6" />
          <path d="M6.5 9h6M6.5 12h6M6.5 15h4" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...shared} {...props}>
          <path d="M3 10.5v3a1 1 0 0 0 1 1h1.8L10 19v-13l-4.2 4.5H4a1 1 0 0 0-1 1z" />
          <path d="M14 9a4 4 0 0 1 0 6" />
          <path d="M17 6.5a8 8 0 0 1 0 11" />
        </svg>
      );
    case "play":
      return (
        <svg {...shared} {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5l6 3.5-6 3.5v-7z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard/keywords", label: "네이버키워드", icon: "search" },
  { href: "/dashboard/blog", label: "네이버블로그", icon: "document" },
  { href: "/dashboard/memos", label: "광고전략메모", icon: "clipboard" },
  { href: "/dashboard/news", label: "뉴스모니터링", icon: "newspaper" },
  { href: "/dashboard/budget", label: "공고모니터링", icon: "megaphone" },
  { href: "/dashboard/youtube", label: "유튜브채널분석", icon: "play" },
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
