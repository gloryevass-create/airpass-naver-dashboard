import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type TeamEvent = {
  id: string;
  title: string;
  dateStart: string;
  dateEnd: string | null;
  isDatetime: boolean;
  category: string | null;
  tags: string[];
  target: string | null;
  location: string | null;
  content: string | null;
  assignees: string[];
  attendees: string[];
  notionUrl: string;
};

/**
 * month는 "YYYY-MM" 형식. 해당 월(+앞뒤 캘린더 그리드에 걸치는 며칠)을 포함하는
 * 넉넉한 범위로 조회한다 — 정확한 그리드 경계는 컴포넌트에서 다시 자른다.
 */
export async function getTeamEvents(supabase: Client, month: string): Promise<TeamEvent[]> {
  const [year, mon] = month.split("-").map(Number);
  const rangeStart = new Date(Date.UTC(year, mon - 2, 21)).toISOString();
  const rangeEnd = new Date(Date.UTC(year, mon, 10)).toISOString();

  const { data } = await supabase
    .from("team_events")
    .select("*")
    .lte("date_start", rangeEnd)
    .or(`date_end.gte.${rangeStart},date_end.is.null`)
    .order("date_start", { ascending: true });

  return (data ?? [])
    .filter((e) => e.date_start >= rangeStart || (e.date_end != null && e.date_end >= rangeStart))
    .map((e) => ({
      id: e.id,
      title: e.title,
      dateStart: e.date_start,
      dateEnd: e.date_end,
      isDatetime: e.is_datetime,
      category: e.category,
      tags: e.tags,
      target: e.target,
      location: e.location,
      content: e.content,
      assignees: e.assignees,
      attendees: e.attendees,
      notionUrl: e.notion_url,
    }));
}
