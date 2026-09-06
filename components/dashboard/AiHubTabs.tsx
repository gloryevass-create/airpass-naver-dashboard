"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 사이드바에서 AI Tools/AI Review/AI Issue 세 항목을 "AI HUB" 하나로 합치면서
// (2026-09-06, 사이드바 세로 길이 축소) 세 페이지 사이를 오가는 탭. Calendar의
// 상단 흰 바(TopSettingsBar, IndustryEventCalendar.tsx — position:sticky,
// 전체 폭, 흰 배경 + 아래쪽 구분선)와 똑같은 컨테이너에 얹고, 그 안의 탭
// 자체는 "월/주/일" 전환과 같은 .seg/.seg-opt 스타일을 그대로 쓴다. 이 바는
// 페이지 콘텐츠의 maxWidth 제약 바깥(전체 폭)에서 렌더링돼야 하므로, 각
// 페이지가 이 컴포넌트를 industry-theme 최상위 바로 아래(maxWidth 래퍼
// 바깥)에 둔다.
const TABS = [
  { href: "/dashboard/ai-tools", label: "AI Tools" },
  { href: "/dashboard/ai-review", label: "AI Review" },
  { href: "/dashboard/ai-issue", label: "AI Issue" },
];

export function AiHubTabs() {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        padding: "10px var(--space-8)",
        background: "#ffffff",
        borderBottom: "1px solid var(--color-divider)",
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <div className="seg">
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
    </div>
  );
}
