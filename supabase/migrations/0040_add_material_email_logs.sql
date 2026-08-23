-- ============================================================================
-- 자료메일발송 — 구글드라이브 공유폴더의 자료를 골라 이메일로 발송하는 기능의
-- 발송 이력. 실제 파일은 이메일에 바이너리로 첨부하지 않고(용량 제한 회피),
-- 구글드라이브 "링크가 있는 사용자는 볼 수 있음" 공유 링크를 본문에 담아 보낸다
-- (사용자 확인, 2026-08-23).
--
-- 발송 자체는 Resend API로 하고(Supabase 기본 메일은 인증 전용이라 부적합 —
-- 별도 안내 완료), 이 테이블은 "누가 언제 누구에게 무엇을 보냈는지" 팀이 함께
-- 볼 수 있는 감사 기록용이다(business_projects_v2 히스토리와 같은 취지).
-- ============================================================================

create table if not exists public.material_email_logs (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_email text not null,
  recipient_emails text[] not null,
  subject text not null,
  message text not null,
  file_names text[] not null default '{}',
  file_links text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_material_email_logs_created_at on public.material_email_logs (created_at desc);

alter table public.material_email_logs enable row level security;

create policy "authenticated can select material email logs"
  on public.material_email_logs for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own material email logs"
  on public.material_email_logs for insert
  with check (auth.role() = 'authenticated' and sender_id = auth.uid());
