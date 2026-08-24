"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { NavIcon, type IconName } from "@/components/icons/NavIcon";
import { useMobileNav } from "@/components/MobileNavContext";

type LeafItem = { href: string; label: string; icon: IconName };
type GroupItem = { label: string; icon: IconName; children: LeafItem[] };
type MenuEntry = LeafItem | GroupItem;

function isGroup(entry: MenuEntry): entry is GroupItem {
  return "children" in entry;
}

// pathname?.startsWith(href) 방식은 "/dashboard/business2"가 "/dashboard/business"의
// prefix라서 둘 다 활성으로 잡히는 문제가 있다 — 정확히 같거나 그 아래 경로일 때만 매칭한다.
function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ITEMS: MenuEntry[] = [
  {
    label: "WORKSPACE",
    icon: "sparkle",
    children: [
      { href: "/dashboard/events2", label: "Calendar", icon: "calendar" },
      { href: "/dashboard/business2", label: "SI Business", icon: "briefcase" },
      { href: "/dashboard/cooperation", label: "Cooperation", icon: "share" },
      { href: "/dashboard/marketing-tasks", label: "Marketing", icon: "list" },
      { href: "/dashboard/memos", label: "Memo Board", icon: "clipboard" },
      { href: "/dashboard/work-journal", label: "Work Journal", icon: "chat" },
    ],
  },
  {
    label: "영업지원",
    icon: "wallet",
    children: [
      { href: "/dashboard/product-catalog", label: "제품 카탈로그", icon: "tag" },
      { href: "/dashboard/vendors", label: "협력사 관리", icon: "wallet" },
      { href: "/dashboard/material-email", label: "자료메일발송", icon: "paperclip" },
    ],
  },
  {
    label: "마케팅분석",
    icon: "chart",
    children: [
      { href: "/dashboard/keywords", label: "네이버키워드", icon: "search" },
      { href: "/dashboard/blog", label: "네이버블로그", icon: "document" },
      { href: "/dashboard/youtube", label: "유튜브채널분석", icon: "play" },
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

  // 이미 열려있는 메뉴를 다시 클릭하면 Next.js Link는 같은 경로라 아무 반응이 없다
  // (편집 폼 등 화면에 남아있는 로컬 상태가 그대로 유지됨) — 이미 활성 상태인 메뉴는
  // 강제로 전체 새로고침해서 항상 그 메뉴의 초기 화면으로 돌아가게 한다.
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    close();
    if (active) {
      e.preventDefault();
      window.location.href = item.href;
    }
  }

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className={`flex items-center justify-between rounded-sm px-3 text-sm transition-colors ${
        indent ? "ml-3 py-1.5" : "py-2"
      } ${
        active
          ? "font-semibold text-primary"
          : "font-medium text-ink hover:bg-canvas-lavender/60 hover:text-primary"
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
  // "데이터베이스" 그룹은 자주 안 쓰는 참고용 공공 DB 목록이라 기본은 접힌 상태로 시작한다
  // (다른 그룹은 그대로 펼쳐진 기본값 유지 — 사용자 확인, 2026-08-24).
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(["데이터베이스"]));
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
            const hasActiveChild = entry.children.some((child) => isActivePath(pathname, child.href));
            const expanded = hasActiveChild || !collapsed.has(entry.label);
            return (
              <div key={entry.label} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.label)}
                  aria-expanded={expanded}
                  className={`flex items-center gap-2.5 rounded-sm px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    hasActiveChild
                      ? "bg-canvas-lavender text-ink"
                      : "text-ink-mute hover:bg-canvas-lavender/40 hover:text-ink"
                  }`}
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
                        active={isActivePath(pathname, child.href)}
                        indent
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return <NavLink key={entry.href} item={entry} active={isActivePath(pathname, entry.href)} />;
        })}
      </div>
      <div className="border-t border-hairline px-3 pt-3">
        <p className="flex items-center gap-1.5 text-xs text-ink-mute">
          <NavIcon name="calendar" className="h-3.5 w-3.5 shrink-0" />
          {latestDate ? `최근 수집일: ${latestDate}` : "아직 수집된 데이터가 없습니다"}
        </p>
        <Link
          href="/dashboard/changelog"
          onClick={close}
          className={`mt-1 flex items-center gap-1.5 text-xs transition-colors ${
            isActivePath(pathname, "/dashboard/changelog")
              ? "font-semibold text-primary"
              : "text-ink-mute hover:text-primary"
          }`}
        >
          <NavIcon name="history" className="h-3.5 w-3.5 shrink-0" />
          업데이트 히스토리
        </Link>
      </div>
      </nav>
    </>
  );
}
