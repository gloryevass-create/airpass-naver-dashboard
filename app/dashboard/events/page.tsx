import { requireAuthedClient } from "@/lib/supabase/authed";
import { getTeamEvents } from "@/lib/queries/events";
import { TeamEventCalendar } from "@/components/dashboard/TeamEventCalendar";
import { EventMonthNav } from "@/components/dashboard/EventMonthNav";
import { NavIcon } from "@/components/icons/NavIcon";

type SearchParams = Promise<{ month?: string }>;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonth();
  const { supabase } = await requireAuthedClient();
  const events = await getTeamEvents(supabase, month);

  return (
    <main className="mx-auto flex w-[90%] flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="calendar" className="h-5 w-5" />
          팀 일정
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          Airpass전략기획 팀 노션의 &ldquo;행사 및 스케쥴&rdquo; 데이터베이스를 그대로 미러링합니다.
          원본은 계속 Notion이며, 여기서는 조회만 가능합니다.
        </p>
      </div>

      <EventMonthNav basePath="/dashboard/events" month={month} />
      <TeamEventCalendar events={events} month={month} />
    </main>
  );
}
