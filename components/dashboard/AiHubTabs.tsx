"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 사이드바에서 AI Tools/AI Review/AI Issue 세 항목을 "AI HUB" 하나로 합치면서
// (2026-09-06, 사이드바 세로 길이 축소) 세 페이지 사이를 오가는 탭 — Calendar의
// "월/주/일" 보기 전환(.seg/.seg-opt, IndustryEventCalendar.tsx)과 같은 스타일을
// 그대로 재사용한다. 세 페이지 각자의 상단(흰 콘텐츠 영역)에 얹는다.
const TABS = [
  { href: "/dashboard/ai-tools", label: "AI Tools" },
  { href: "/dashboard/ai-review", label: "AI Review" },
  { href: "/dashboard/ai-issue", label: "AI Issue" },
];

export function AiHubTabs() {
  const pathname = usePathname();

  return (
    <div className="seg" style={{ marginBottom: "var(--space-6)", width: "fit-content" }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`seg-opt${active ? " active" : ""}`}
            style={{ border: 0, textDecoration: "none" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
