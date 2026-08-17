import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

const DEFAULT_RANGE_DAYS = 30;
const VIDEO_DISPLAY_LIMIT = 300;

function daysBefore(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function getLatestChannelStatsDate(supabase: Client): Promise<string | null> {
  const { data } = await supabase
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

export async function getChannelStats(
  supabase: Client,
  options?: { since?: string; until?: string }
): Promise<ChannelStatsResult> {
  const latestDate = (await getLatestChannelStatsDate(supabase)) ?? new Date().toISOString().slice(0, 10);
  const since = options?.since ?? daysBefore(latestDate, DEFAULT_RANGE_DAYS - 1);
  const until = options?.until ?? latestDate;

  const [{ data: trendData }, { data: latestData }] = await Promise.all([
    supabase
      .from("youtube_channel_stats")
      .select("*")
      .gte("date", since)
      .lte("date", until)
      .order("date", { ascending: true }),
    supabase.from("youtube_channel_stats").select("*").eq("date", latestDate).maybeSingle(),
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
    range: { since, until },
  };
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

export async function getYoutubeVideos(supabase: Client): Promise<YoutubeVideo[]> {
  const { data } = await supabase
    .from("youtube_videos")
    .select("*")
    .order("view_count", { ascending: false })
    .limit(VIDEO_DISPLAY_LIMIT);

  return (data ?? []).map((v) => ({
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
