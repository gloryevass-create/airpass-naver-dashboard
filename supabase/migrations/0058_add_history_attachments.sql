-- ============================================================================
-- SI Business/Cooperation/Marketing 보드의 "히스토리" 항목에 파일 첨부 기능을
-- 추가한다(2026-09-06). 세 보드의 히스토리 테이블(business_projects_v2_history/
-- cooperation_projects_history/marketing_tasks_history)이 구조적으로 동일해서
-- 첨부파일 테이블도 같은 모양으로 3개 만든다(history_id FK만 각자 자기
-- 히스토리 테이블을 가리킴 — 폴리모픽 단일 테이블 대신 각자 FK를 둬서
-- 히스토리 삭제 시 cascade가 자연스럽게 동작하게 한다).
--
-- Work Journal/Memo Board/제조사 관리와 같은 패턴으로 구글드라이브(회사 공용
-- OAuth 연결)에 우선 올리고, 미설정 시에만 Supabase Storage
-- "history-attachments" 버킷(세 보드가 공유, 경로를 서비스명/history_id로
-- 구분)으로 폴백한다 — storage_path/drive_file_id 둘 다 nullable, 한 행엔
-- 하나만 채워진다(lib/historyAttachments.ts).
-- ============================================================================

create table if not exists public.business_projects_v2_history_attachments (
  id uuid primary key default gen_random_uuid(),
  history_id uuid not null references public.business_projects_v2_history (id) on delete cascade,
  file_name text not null,
  content_type text,
  storage_path text,
  drive_file_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_business_history_attachments_history
  on public.business_projects_v2_history_attachments (history_id);
alter table public.business_projects_v2_history_attachments enable row level security;
create policy "authenticated can select business history attachments"
  on public.business_projects_v2_history_attachments for select
  using (auth.role() = 'authenticated');
create policy "authenticated can insert business history attachments"
  on public.business_projects_v2_history_attachments for insert
  with check (auth.role() = 'authenticated');
create policy "authenticated can delete business history attachments"
  on public.business_projects_v2_history_attachments for delete
  using (auth.role() = 'authenticated');

create table if not exists public.cooperation_projects_history_attachments (
  id uuid primary key default gen_random_uuid(),
  history_id uuid not null references public.cooperation_projects_history (id) on delete cascade,
  file_name text not null,
  content_type text,
  storage_path text,
  drive_file_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_cooperation_history_attachments_history
  on public.cooperation_projects_history_attachments (history_id);
alter table public.cooperation_projects_history_attachments enable row level security;
create policy "authenticated can select cooperation history attachments"
  on public.cooperation_projects_history_attachments for select
  using (auth.role() = 'authenticated');
create policy "authenticated can insert cooperation history attachments"
  on public.cooperation_projects_history_attachments for insert
  with check (auth.role() = 'authenticated');
create policy "authenticated can delete cooperation history attachments"
  on public.cooperation_projects_history_attachments for delete
  using (auth.role() = 'authenticated');

create table if not exists public.marketing_tasks_history_attachments (
  id uuid primary key default gen_random_uuid(),
  history_id uuid not null references public.marketing_tasks_history (id) on delete cascade,
  file_name text not null,
  content_type text,
  storage_path text,
  drive_file_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_marketing_history_attachments_history
  on public.marketing_tasks_history_attachments (history_id);
alter table public.marketing_tasks_history_attachments enable row level security;
create policy "authenticated can select marketing history attachments"
  on public.marketing_tasks_history_attachments for select
  using (auth.role() = 'authenticated');
create policy "authenticated can insert marketing history attachments"
  on public.marketing_tasks_history_attachments for insert
  with check (auth.role() = 'authenticated');
create policy "authenticated can delete marketing history attachments"
  on public.marketing_tasks_history_attachments for delete
  using (auth.role() = 'authenticated');

-- 세 보드가 공유하는 Storage 폴백 버킷(구글드라이브 미설정 시에만 쓰임).
insert into storage.buckets (id, name, public)
values ('history-attachments', 'history-attachments', false)
on conflict (id) do nothing;

create policy "authenticated can upload history attachments"
  on storage.objects for insert
  with check (bucket_id = 'history-attachments' and auth.role() = 'authenticated');

create policy "authenticated can read history attachments"
  on storage.objects for select
  using (bucket_id = 'history-attachments' and auth.role() = 'authenticated');

create policy "authenticated can delete history attachment files"
  on storage.objects for delete
  using (bucket_id = 'history-attachments' and auth.role() = 'authenticated');
