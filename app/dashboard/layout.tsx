import { requireAuthedClient } from "@/lib/supabase/authed";
import { getLatestDataDate } from "@/lib/queries/dashboard";
import { getNotifications } from "@/lib/queries/notifications";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MobileNavProvider } from "@/components/MobileNavContext";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAuthedClient();

  const [{ data: profile }, latestDate, notifications, teamMembers] = await Promise.all([
    supabase.from("profiles").select("role, name, title").eq("id", user.id).single(),
    getLatestDataDate(),
    getNotifications(supabase, user.id),
    getTeamMemberNames(supabase),
  ]);

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
      <div className="flex h-screen flex-col overflow-hidden print:h-auto print:overflow-visible">
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
