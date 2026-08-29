import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getTeamEventsV2, eventsV2RangeForMonth } from "@/lib/queries/eventsV2";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { getGoogleCalendarConnection, getMyGoogleCalendarEvents } from "@/lib/queries/googleCalendar";
import { IndustryEventCalendar } from "@/components/dashboard/IndustryEventCalendar";

type SearchParams = Promise<{ month?: string; day?: string; googleConnected?: string; googleError?: string }>;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentDay() {
  return new Date().toISOString().slice(0, 10);
}

export default async function Events2Page({ searchParams }: { searchParams: SearchParams }) {
  const { month: monthParam, day: dayParam, googleConnected, googleError } = await searchParams;
  const month = monthParam ?? currentMonth();
  const day = dayParam ?? (month === currentMonth() ? currentDay() : `${month}-01`);
  const { supabase, user } = await requireAuthedClient();
  const { rangeStart, rangeEnd } = eventsV2RangeForMonth(month);

  const [events, members, googleConnection, googleEvents] = await Promise.all([
    getTeamEventsV2(supabase, month),
    getTeamMemberNames(supabase),
    getGoogleCalendarConnection(supabase, user.id),
    getMyGoogleCalendarEvents(supabase, user.id, rangeStart, rangeEnd),
  ]);

  return (
    <IndustryEventCalendar
      events={events}
      month={month}
      initialCursor={day}
      members={members}
      googleConnection={googleConnection}
      googleEvents={googleEvents}
      googleConnected={googleConnected === "1"}
      googleError={googleError ?? null}
    />
  );
}
