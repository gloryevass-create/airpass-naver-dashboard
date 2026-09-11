-- ============================================================================
-- 할 일 관리(2026-09-11) — Manyfast로 작성한 "할 일 관리 서비스" PRD를
-- 대시보드 안의 새 메뉴(/dashboard/todos)로 통합. 다른 모든 기능(팀 공유,
-- 작성자/관리자 수정 가능)과 달리 이 기능은 PRD 요구사항대로 완전히
-- 개인 소유 데이터라 admin 우회 정책을 두지 않는다 — 본인 외에는 select도
-- 안 된다.
-- ============================================================================

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  due_date date,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  is_completed boolean not null default false,
  completed_at timestamptz,
  alarm_at timestamptz,
  alarm_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_todos_owner_completed_due on public.todos (owner_id, is_completed, due_date);

-- 알람 크론(app/api/cron/todo-alarms)이 "발송 시각이 된, 아직 안 보낸, 완료
-- 안 된" 알람만 빠르게 찾기 위한 부분 인덱스.
create index if not exists idx_todos_pending_alarm on public.todos (alarm_at)
  where alarm_sent = false and is_completed = false and alarm_at is not null;

alter table public.todos enable row level security;

create policy "owner can select own todos"
  on public.todos for select
  using (auth.role() = 'authenticated' and owner_id = auth.uid());

create policy "owner can insert own todos"
  on public.todos for insert
  with check (auth.role() = 'authenticated' and owner_id = auth.uid());

create policy "owner can update own todos"
  on public.todos for update
  using (auth.role() = 'authenticated' and owner_id = auth.uid());

create policy "owner can delete own todos"
  on public.todos for delete
  using (auth.role() = 'authenticated' and owner_id = auth.uid());

-- 브라우저 Web Push 구독 정보. 알람 크론이 service_role로 조회해 발송하고,
-- 만료된(410 Gone) 구독은 크론이 직접 지운다.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "user can select own push subscriptions"
  on public.push_subscriptions for select
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "user can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "user can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.role() = 'authenticated' and user_id = auth.uid());
