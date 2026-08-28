import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getTeamEventsV2 } from "@/lib/queries/eventsV2";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { IndustryEventCalendar } from "@/components/dashboard/IndustryEventCalendar";

type SearchParams = Promise<{ month?: string; day?: string }>;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentDay() {
  return new Date().toISOString().slice(0, 10);
}

// Claude Design "Industry" 테마로 다시 그린 캘린더(2026-08-29) — 월/주/일 보기
// 전환이 새로 생겼지만, 데이터는 기존과 똑같이 서버에서 month 단위로만
// 불러온다. 주/일 보기에서 달 경계를 넘어가면 URL의 day도 같이 갱신해서,
// 새로 불러온 달의 데이터에서 정확히 그 날짜부터 다시 보여준다
// (IndustryEventCalendar.tsx의 navigateTo 참고).
export default async function Events2Page({ searchParams }: { searchParams: SearchParams }) {
  const { month: monthParam, day: dayParam } = await searchParams;
  const month = monthParam ?? currentMonth();
  const day = dayParam ?? (month === currentMonth() ? currentDay() : `${month}-01`);
  const { supabase } = await requireAuthedClient();
  const [events, members] = await Promise.all([
    getTeamEventsV2(supabase, month),
    getTeamMemberNames(supabase),
  ]);

  return <IndustryEventCalendar events={events} month={month} initialCursor={day} members={members} />;
}
