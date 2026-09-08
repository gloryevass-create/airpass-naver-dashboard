import type { CSSProperties } from "react";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getLatestDataDate } from "@/lib/queries/dashboard";
import { getNotifications } from "@/lib/queries/notifications";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MobileNavProvider } from "@/components/MobileNavContext";

// 개인별 폰트 설정(profiles.font_preference, 2026-09-08) — "시스템 기본 폰트"를
// 고르면 app/globals.css가 전역 기본값으로 쓰는 Pretendard 대신 이 값으로
// --font-sans를 덮어쓴다. industryTheme.css의 --font-heading/--font-body가
// var(--font-sans)를 그대로 참조하도록 통일해 둔 덕분에, 이 값 하나만 최상위
// 래퍼에 인라인으로 얹으면 그 안의 모든 Industry 테마 화면까지 한 번에 반영된다
// (사이드바는 dashboardSidebarTheme.css가 자체 원칙상 CSS 변수를 안 쓰고
// Pretendard를 하드코딩해 둬서 이 설정의 영향을 받지 않는다 — 사용자 확인).
// 산출내역 인쇄본/고객 공개 페이지(/quote)는 이 레이아웃 바깥이라 항상 고정값.
const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", Roboto, Helvetica, Arial, sans-serif';
// G마켓 산스(2026-09-08 추가, 사용자 제공 @font-face) — 300/500/700 세 굵기만 있어
// industryTheme.css가 기본으로 쓰는 --font-heading-weight: 600이 정확히 없다.
// 이 폰트를 고른 사람만 700(Bold)로 같이 덮어써서 헤딩이 어중간한 굵기로
// 대체되지 않게 한다(가장 눈에 띄는 요소라 우선 처리, 본문 400은 브라우저의
// 가장 가까운 굵기 자동 대체에 맡김).
const GMARKET_FONT_STACK = '"GMarketSans", -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif';
// 나눔스퀘어(2026-09-08 추가) — 300/400/700/800 네 굵기가 있어 본문 400은
// 그대로 맞지만 헤딩용 600은 역시 없어서 G마켓 산스와 같은 이유로 700을 쓴다.
const NANUMSQUARE_FONT_STACK = '"NanumSquare", -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif';

// 선택지가 늘어날수록 삼항연산자 체인이 읽기 어려워져서 맵으로 정리한다 — pretendard는
// globals.css 전역 기본값을 그대로 쓰므로 이 맵에 없으면(기본값) 아무것도 덮어쓰지 않는다.
const FONT_OVERRIDES: Record<string, CSSProperties> = {
  system: { "--font-sans": SYSTEM_FONT_STACK } as CSSProperties,
  gmarket: { "--font-sans": GMARKET_FONT_STACK, "--font-heading-weight": 700 } as CSSProperties,
  nanumsquare: { "--font-sans": NANUMSQUARE_FONT_STACK, "--font-heading-weight": 700 } as CSSProperties,
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAuthedClient();

  const [{ data: profile }, latestDate, notifications, teamMembers] = await Promise.all([
    supabase.from("profiles").select("role, name, title, font_preference").eq("id", user.id).single(),
    getLatestDataDate(),
    getNotifications(supabase, user.id),
    getTeamMemberNames(supabase),
  ]);

  const fontOverrideStyle: CSSProperties = (profile?.font_preference && FONT_OVERRIDES[profile.font_preference]) || {};

  return (
    <MobileNavProvider>
      {/* 헤더·사이드바는 화면에 고정하고 본문 영역만 따로 스크롤되도록, 전체 셸을
          뷰포트 높이로 못박는다 — 이렇게 실제 높이 제약이 있어야 사이드바 안의
          "그룹 목록만 스크롤" 같은 내부 스크롤 영역도 정상 동작한다(사용자 확인,
          2026-08-28 — 이전엔 body/상위 요소 어디에도 높이 제약이 없어 사이드바가
          부분 스크롤되지 않고 페이지 전체가 통째로 스크롤됐음). */}
      {/* print: 인쇄용 페이지(예: 산출내역 인쇄)는 이 레이아웃 안에서 렌더링되는데,
          높이를 뷰포트로 못박고 overflow를 숨기면 인쇄 시 화면에 안 보이던
          부분이 잘려 나간다 — 인쇄 시에는 높이·overflow 제약을 전부 풀어
          문서가 원래 길이대로 종이에 이어지게 한다. */}
      <div className="flex h-screen flex-col overflow-hidden print:h-auto print:overflow-visible" style={fontOverrideStyle}>
        <DashboardHeader
          email={user.email ?? ""}
          name={profile?.name ?? null}
          title={profile?.title ?? null}
          isAdmin={profile?.role === "admin"}
          userId={user.id}
          notifications={notifications}
          teamMembers={teamMembers}
        />
        <div className="flex min-h-0 flex-1 overflow-x-hidden print:overflow-visible">
          <DashboardSidebar latestDate={latestDate} />
          <div className="min-w-0 flex-1 overflow-y-auto print:h-auto print:overflow-visible">{children}</div>
        </div>
      </div>
    </MobileNavProvider>
  );
}
