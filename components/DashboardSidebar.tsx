"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NavIcon, type IconName } from "@/components/icons/NavIcon";
import { useMobileNav } from "@/components/MobileNavContext";

type LeafItem = { href: string; label: string; icon: IconName };
type GroupItem = { label: string; icon: IconName; children: LeafItem[] };
type MenuEntry = LeafItem | GroupItem;

function isGroup(entry: MenuEntry): entry is GroupItem {
  return "children" in entry;
}

const ITEMS: MenuEntry[] = [
  {
    label: "WORKSPACE",
    icon: "sparkle",
    children: [
      { href: "/dashboard/events", label: "팀 일정", icon: "calendar" },
      { href: "/dashboard/business", label: "비즈니스", icon: "briefcase" },
    ],
  },
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
      { href: "/dashboard/db/senior-welfare-facilities", label: "전국경로당현황", icon: "tag" },
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
  const { close } = useMobileNav();
  return (
    <Link
      href={item.href}
      onClick={close}
      className={`flex items-center justify-between rounded-md px-3 text-sm transition-colors ${
        indent ? "ml-3 py-1.5" : "py-2"
      } ${
        active
          ? "font-semibold text-primary"
          : "font-medium text-ink hover:text-primary"
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

export function DashboardSidebar({ latestDate }: { latestDate: string | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { open, close } = useMobileNav();

  // 모바일에서 링크를 눌러 페이지가 바뀌면 드로어를 자동으로 닫는다(NavLink의
  // onClick으로도 닫히지만, 그룹 헤더 클릭 없이 바로 이동하는 다른 경로 대비 안전망).
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <nav
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-hairline bg-[#fafafa] p-4 transition-transform duration-200 md:static md:z-auto md:w-56 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="flex flex-1 flex-col gap-1">
        {ITEMS.map((entry) => {
          if (isGroup(entry)) {
            const hasActiveChild = entry.children.some((child) => pathname?.startsWith(child.href));
            const expanded = hasActiveChild || !collapsed.has(entry.label);
            return (
              <div key={entry.label} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.label)}
                  aria-expanded={expanded}
                  className="flex items-center gap-2.5 px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-mute hover:text-ink"
                >
                  <NavIcon name={entry.icon} className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">{entry.label}</span>
                  <NavIcon
                    name="chevron"
                    className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
                  />
                </button>
                {expanded && (
                  <div className="flex flex-col gap-0.5">
                    {entry.children.map((child) => (
                      <NavLink
                        key={child.href}
                        item={child}
                        active={Boolean(pathname?.startsWith(child.href))}
                        indent
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return <NavLink key={entry.href} item={entry} active={Boolean(pathname?.startsWith(entry.href))} />;
        })}
      </div>
      <p className="border-t border-hairline px-3 pt-3 text-xs text-ink-mute">
        {latestDate ? `최근 수집일: ${latestDate}` : "아직 수집된 데이터가 없습니다"}
      </p>
      </nav>
    </>
  );
}
