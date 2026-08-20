-- ============================================================================
-- 알림(팀 공유 피드) — 팀일정 변동, 비즈니스 변동, 네이버키워드 잔액 부족, 유튜브
-- 영상업로드, 광고전략메모, 조달입찰공고/사전규격 스크랩 발생 시 생성된다.
--
-- notifications는 팀 전체가 공유하는 하나의 피드(모든 authenticated가 SELECT 가능).
-- 읽음 상태는 사용자별로 따로 관리한다(notification_reads) — 내가 읽어도 다른
-- 팀원에게는 계속 안읽음으로 보인다.
--
-- 이벤트/비즈니스/유튜브/예산 트랙은 airpass-naver-monitor 파이프라인이
-- service_role로 삽입한다(diff 감지). 메모/스크랩은 이 대시보드 자체의 Server
-- Action이 authenticated 세션으로 삽입한다.
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (
    type in ('event', 'business', 'youtube', 'budget_low', 'memo', 'budget_scrap', 'prespec_scrap')
  ),
  title text not null,
  message text,
  link text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_created_at on public.notifications (created_at desc);

alter table public.notifications enable row level security;

create policy "authenticated can select notifications"
  on public.notifications for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table public.notification_reads enable row level security;

create policy "select own notification reads"
  on public.notification_reads for select
  using (user_id = auth.uid());

create policy "insert own notification reads"
  on public.notification_reads for insert
  with check (user_id = auth.uid());

-- 인앱 실시간 알림(Supabase Realtime)을 위해 이 테이블의 변경을 브로드캐스트한다.
alter publication supabase_realtime add table public.notifications;
