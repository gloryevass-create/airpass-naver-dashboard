-- ============================================================================
-- 업무일지 — 노션 개인 페이지(예: "2024 > 박준찬")에 있던 주차별 업무 기록을
-- 이 시스템으로 옮겨오기 위한 테이블. 팀원별 업무일지를 이 시스템이 직접
-- 소유하며 관리한다(Notion 연동 없음, 사용자 확인 2026-08-24).
--
-- author_name은 profiles.name과 매칭되는 팀원 이름(자유 텍스트) — 다른 담당자류
-- 필드와 달리 이 테이블은 "누구의 일지인가"가 핵심이라 컴포넌트에서
-- MemberMultiSelect 대신 단일 select로 고른다.
-- ============================================================================

create table if not exists public.work_journal_entries (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  week_label text,
  entry_date date,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_work_journal_entries_author on public.work_journal_entries (author_name);
create index if not exists idx_work_journal_entries_date on public.work_journal_entries (entry_date);

alter table public.work_journal_entries enable row level security;

create policy "authenticated can select work journal entries"
  on public.work_journal_entries for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert work journal entries"
  on public.work_journal_entries for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update work journal entries"
  on public.work_journal_entries for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete work journal entries"
  on public.work_journal_entries for delete
  using (auth.role() = 'authenticated');

-- 이미지·PDF·도면(CAD/AI)·오피스 문서 등 원본 노션 첨부파일을 그대로 옮겨 담는다.
create table if not exists public.work_journal_attachments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.work_journal_entries (id) on delete cascade,
  file_name text not null,
  content_type text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_journal_attachments_entry on public.work_journal_attachments (entry_id);

alter table public.work_journal_attachments enable row level security;

create policy "authenticated can select work journal attachments"
  on public.work_journal_attachments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert work journal attachments"
  on public.work_journal_attachments for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can delete work journal attachments"
  on public.work_journal_attachments for delete
  using (auth.role() = 'authenticated');

-- 첨부파일 저장용 Storage 버킷 — 비공개(public=false), signed URL로만 다운로드 허용
-- (memo-attachments/vendor-documents와 동일한 패턴).
insert into storage.buckets (id, name, public)
values ('journal-attachments', 'journal-attachments', false)
on conflict (id) do nothing;

create policy "authenticated can upload journal attachments"
  on storage.objects for insert
  with check (bucket_id = 'journal-attachments' and auth.role() = 'authenticated');

create policy "authenticated can read journal attachments"
  on storage.objects for select
  using (bucket_id = 'journal-attachments' and auth.role() = 'authenticated');

create policy "authenticated can delete journal attachment files"
  on storage.objects for delete
  using (bucket_id = 'journal-attachments' and auth.role() = 'authenticated');
