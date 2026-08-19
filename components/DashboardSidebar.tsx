"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type IconName } from "@/components/icons/NavIcon";

type LeafItem = { href: string; label: string; icon: IconName };
type GroupItem = { label: string; icon: IconName; children: LeafItem[] };
type MenuEntry = LeafItem | GroupItem;

function isGroup(entry: MenuEntry): entry is GroupItem {
  return "children" in entry;
}

const ITEMS: MenuEntry[] = [
  { href: "/dashboard/events", label: "팀 일정", icon: "calendar" },
  { href: "/dashboard/business", label: "비즈니스", icon: "briefcase" },
  {
    label: "마케팅분석",
    icon: "chart",
    children: [
      { href: "/dashboard/keywords", label: "네이버키워드", icon: "search" },
      { href: "/dashboard/blog", label: "네이버블로그", icon: "document" },
      { href: "/dashboard/youtube", label: "유튜브채널분석", icon: "play" },
      { href: "/dashboard/memos", label: "광고전략메모", icon: "clipboard" },
    ],
  },
  {
    label: "모니터링",
    icon: "alert",
    children: [
      { href: "/dashboard/budget", label: "조달입찰공고", icon: "megaphone" },
      { href: "/dashboard/prespec", label: "조달사전규격", icon: "search" },
      { href: "/dashboard/news", label: "교육관련뉴스", icon: "newspaper" },
    ],
  },
  {
    label: "데이터베이스",
    icon: "list",
    children: [
      { href: "/dashboard/db/youth-facilities", label: "청소년관련기관", icon: "tag" },
      { href: "/dashboard/db/disability-organizations", label: "장애인관련기관", icon: "tag" },
      { href: "/dashboard/db/disability-sports", label: "장애인체육시설", icon: "tag" },
      { href: "/dashboard/db/disability-welfare", label: "장애인편의시설", icon: "tag" },
      { href: "/dashboard/db/special-schools", label: "특수학교현황", icon: "tag" },
      { href: "/dashboard/db/public-institutions", label: "공공기관정보", icon: "tag" },
    ],
  },
];

function NavSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
  );
}

function NavLink({ item, active, indent }: { item: LeafItem; active: boolean; indent?: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        indent ? "ml-3" : ""
      } ${
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
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-hairline p-4">
      {ITEMS.map((entry) => {
        if (isGroup(entry)) {
          return (
            <div key={entry.label} className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 px-3 pt-3 pb-1 text-sm font-semibold text-ink-mute/70">
                <NavIcon name={entry.icon} className="h-4 w-4 shrink-0" />
                {entry.label}
              </div>
              {entry.children.map((child) => (
                <NavLink
                  key={child.href}
                  item={child}
                  active={Boolean(pathname?.startsWith(child.href))}
                  indent
                />
              ))}
            </div>
          );
        }
        return <NavLink key={entry.href} item={entry} active={Boolean(pathname?.startsWith(entry.href))} />;
      })}
    </nav>
  );
}
