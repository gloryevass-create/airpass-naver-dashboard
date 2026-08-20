import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

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
 *
 * team_events는 Notion을 파이프라인이 하루 한 번 미러링만 하고 대시보드에서는
 * 쓰지 않는 읽기 전용 데이터라 admin 클라이언트 + unstable_cache(1시간 재검증)로
 * 감싼다. 인증 게이트는 호출부의 requireAuthedClient()가 담당하므로 supabase
 * 클라이언트 인자를 받지 않는다. month는 캐시 키에 포함해 월별로 별도 캐시된다.
 */
async function fetchTeamEvents(month: string): Promise<TeamEvent[]> {
  const admin = createAdminClient();
  const [year, mon] = month.split("-").map(Number);
  const rangeStart = new Date(Date.UTC(year, mon - 2, 21)).toISOString();
  const rangeEnd = new Date(Date.UTC(year, mon, 10)).toISOString();

  const { data } = await admin
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

export async function getTeamEvents(month: string): Promise<TeamEvent[]> {
  const cached = unstable_cache(fetchTeamEvents, ["team-events", month], { revalidate: 3600 });
  return cached(month);
}
