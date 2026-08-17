-- ============================================================================
-- 유튜브 채널 분석 — 에어패스 공식 채널(@AIRPASS_XR) 운영 현황
--
-- YouTube Data API v3(공식, API 키 인증)로 채널 통계와 영상별 성과를 수집한다.
-- 다른 모니터링 데이터와 동일하게 읽기 전용(authenticated는 SELECT만, 쓰기는
-- service_role만).
-- ============================================================================

-- 채널 전체 통계의 일별 스냅샷 — 구독자 수·조회수 성장 추이 그래프에 쓰인다.
create table if not exists public.youtube_channel_stats (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  subscriber_count integer not null default 0,
  view_count bigint not null default 0,
  video_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_yt_channel_stats_date on public.youtube_channel_stats (date desc);

alter table public.youtube_channel_stats enable row level security;

create policy "authenticated can select youtube channel stats"
  on public.youtube_channel_stats for select
  using (auth.role() = 'authenticated');

-- 영상별 최신 성과 — 매일 전체 영상을 다시 조회해 upsert한다(video_id 고유).
create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  video_id text not null unique,
  title text not null,
  published_at timestamptz,
  view_count bigint not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  duration_seconds integer,
  thumbnail_url text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_yt_videos_view_count on public.youtube_videos (view_count desc);
create index if not exists idx_yt_videos_published_at on public.youtube_videos (published_at desc);

alter table public.youtube_videos enable row level security;

create policy "authenticated can select youtube videos"
  on public.youtube_videos for select
  using (auth.role() = 'authenticated');
