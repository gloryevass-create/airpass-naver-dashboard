import { requireAuthedClient } from "@/lib/supabase/authed";
import { getChannelStats, getYoutubeVideos } from "@/lib/queries/youtube";
import { YoutubeChannelStats } from "@/components/dashboard/YoutubeChannelStats";
import { YoutubeVideoTable } from "@/components/dashboard/YoutubeVideoTable";
import { MonitorDateRangeFilter } from "@/components/dashboard/MonitorDateRangeFilter";
import { NavIcon } from "@/components/icons/NavIcon";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function YoutubePage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = await searchParams;
  const { supabase } = await requireAuthedClient();
  const [channelStats, videos] = await Promise.all([
    getChannelStats(supabase, { since: from, until: to }),
    getYoutubeVideos(supabase),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="play" className="h-5 w-5" />
          유튜브 채널 분석
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          에어패스 공식 유튜브 채널(
          <a
            href="https://www.youtube.com/@AIRPASS_XR"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link-blue hover:underline"
          >
            @AIRPASS_XR
          </a>
          ) 운영 현황 — 구독자·조회수 성장 추이와 영상별 성과를 모읍니다(YouTube Data API v3
          공식 기반).
        </p>
      </div>

      <MonitorDateRangeFilter
        basePath="/dashboard/youtube"
        range={channelStats.range}
        resultCount={channelStats.trend.length}
      />
      <YoutubeChannelStats data={channelStats} />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-mute">영상별 성과</h2>
        <YoutubeVideoTable videos={videos} />
      </section>
    </main>
  );
}
