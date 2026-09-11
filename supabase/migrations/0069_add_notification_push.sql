-- ============================================================================
-- 알림벨 브라우저 푸시(2026-09-12) — 상단 알림벨(NotificationBell)에 뜨는
-- 팀 공유 알림(사업변경/메모/유튜브업로드/예산부족/산출내역 등)이 새로 생길
-- 때마다, 구독한 팀원 전원에게 Web Push도 함께 보낸다. 알림은 이 앱의 여러
-- 서버 액션뿐 아니라 별도 저장소(airpass-naver-monitor)가 service_role로
-- 직접 삽입하는 유튜브/예산부족 건도 있어(CLAUDE.md 참고) 호출부를 일일이
-- 고치는 대신 DB 트리거로 insert 시점 자체를 가로챈다 — profiles의
-- on_auth_user_created 트리거(0001)와 같은 패턴.
-- ============================================================================

create table if not exists public.notification_push_queue (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_push_queue_pending on public.notification_push_queue (created_at)
  where processed = false;

-- 클라이언트는 이 큐를 직접 읽거나 쓸 필요가 없다 — 아래 트리거(security
-- definer)와 발송 크론(service_role)만 접근한다. authenticated용 정책을
-- 두지 않아 기본 거부(RLS enabled + 정책 없음 = 전체 차단)로 막는다.
alter table public.notification_push_queue enable row level security;

create or replace function public.enqueue_notification_push()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notification_push_queue (notification_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_notification_created_enqueue_push on public.notifications;
create trigger on_notification_created_enqueue_push
  after insert on public.notifications
  for each row execute function public.enqueue_notification_push();
