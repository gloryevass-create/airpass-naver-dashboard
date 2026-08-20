import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_RANGE_DAYS = 30;
const VIDEO_DISPLAY_LIMIT = 300;

function daysBefore(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function getLatestChannelStatsDate(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const { data } = await admin
    .from("youtube_channel_stats")
    .select("date")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.date ?? null;
}

export type ChannelStatsPoint = {
  date: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
};

export type ChannelStatsResult = {
  latest: ChannelStatsPoint | null;
  trend: ChannelStatsPoint[];
  range: { since: string; until: string };
};

// 유튜브 채널 통계·영상은 대시보드가 쓰지 않는 파이프라인 전용 참고 데이터라
// admin 클라이언트 + unstable_cache(1시간 재검증)로 감싼다. 인증 게이트는
// 호출부의 requireAuthedClient()가 담당하므로 supabase 클라이언트 인자를 받지
// 않는다. 기간(since/until)은 사용자가 URL로 임의 지정할 수 있으므로 캐시 키에
// 포함해 기간별로 별도 캐시된다.
async function fetchChannelStats(since?: string, until?: string): Promise<ChannelStatsResult> {
  const admin = createAdminClient();
  const latestDate = (await getLatestChannelStatsDate(admin)) ?? new Date().toISOString().slice(0, 10);
  const resolvedSince = since ?? daysBefore(latestDate, DEFAULT_RANGE_DAYS - 1);
  const resolvedUntil = until ?? latestDate;

  const [{ data: trendData }, { data: latestData }] = await Promise.all([
    admin
      .from("youtube_channel_stats")
      .select("*")
      .gte("date", resolvedSince)
      .lte("date", resolvedUntil)
      .order("date", { ascending: true }),
    admin.from("youtube_channel_stats").select("*").eq("date", latestDate).maybeSingle(),
  ]);

  const trend = (trendData ?? []).map((r) => ({
    date: r.date,
    subscriberCount: r.subscriber_count,
    viewCount: r.view_count,
    videoCount: r.video_count,
  }));

  return {
    latest: latestData
      ? {
          date: latestData.date,
          subscriberCount: latestData.subscriber_count,
          viewCount: latestData.view_count,
          videoCount: latestData.video_count,
        }
      : null,
    trend,
    range: { since: resolvedSince, until: resolvedUntil },
  };
}

export async function getChannelStats(options?: { since?: string; until?: string }): Promise<ChannelStatsResult> {
  const since = options?.since;
  const until = options?.until;
  const cached = unstable_cache(fetchChannelStats, ["youtube-channel-stats", since ?? "_", until ?? "_"], {
    revalidate: 3600,
  });
  return cached(since, until);
}

export type YoutubeVideo = {
  id: string;
  videoId: string;
  title: string;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
};

const getCachedVideos = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("youtube_videos")
      .select("*")
      .order("view_count", { ascending: false })
      .limit(VIDEO_DISPLAY_LIMIT);
    return data ?? [];
  },
  ["youtube-videos"],
  { revalidate: 3600 }
);

export async function getYoutubeVideos(): Promise<YoutubeVideo[]> {
  const data = await getCachedVideos();

  return data.map((v) => ({
    id: v.id,
    videoId: v.video_id,
    title: v.title,
    publishedAt: v.published_at,
    viewCount: v.view_count,
    likeCount: v.like_count,
    commentCount: v.comment_count,
    durationSeconds: v.duration_seconds,
    thumbnailUrl: v.thumbnail_url,
  }));
}
