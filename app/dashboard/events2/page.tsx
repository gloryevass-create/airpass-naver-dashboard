import { requireAuthedClient } from "@/lib/supabase/authed";
import { getTeamEventsV2 } from "@/lib/queries/eventsV2";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { TeamEventCalendarV2 } from "@/components/dashboard/TeamEventCalendarV2";
import { NavIcon } from "@/components/icons/NavIcon";

type SearchParams = Promise<{ month?: string }>;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function Events2Page({ searchParams }: { searchParams: SearchParams }) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();
  const { supabase } = await requireAuthedClient();
  const [events, members] = await Promise.all([
    getTeamEventsV2(supabase, month),
    getTeamMemberNames(supabase),
  ]);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="calendar" className="h-5 w-5" />
          Calendar
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          이 화면에서 직접 일정을 추가·수정·삭제합니다(Notion 연동 없음 — 이 시스템이 원본입니다).
        </p>
      </div>

      <TeamEventCalendarV2 events={events} month={month} members={members} />
    </main>
  );
}
