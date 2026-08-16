-- ============================================================================
-- 광고전략메모 게시판 — 메모 / 첨부파일 / 댓글
--
-- 기존 모니터링 데이터 테이블과 달리 이 세 테이블은 읽기 전용이 아니라 로그인한
-- 팀원이라면 누구나 글/댓글을 쓸 수 있어야 한다. service_role이 아니라 실제 로그인
-- 세션(authenticated, auth.uid())으로 삽입하고, author_id가 자기 자신인 경우만
-- 허용해 다른 사람 이름으로 글을 올릴 수 없게 한다.
-- ============================================================================

create table if not exists public.ad_strategy_memos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  category text not null check (category in ('keyword', 'blog', 'etc')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_memos_created_at on public.ad_strategy_memos (created_at desc);

alter table public.ad_strategy_memos enable row level security;

create policy "authenticated can select memos"
  on public.ad_strategy_memos for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own memos"
  on public.ad_strategy_memos for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create table if not exists public.ad_strategy_memo_attachments (
  id uuid primary key default gen_random_uuid(),
  memo_id uuid not null references public.ad_strategy_memos (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_memo_attachments_memo on public.ad_strategy_memo_attachments (memo_id);

alter table public.ad_strategy_memo_attachments enable row level security;

create policy "authenticated can select attachments"
  on public.ad_strategy_memo_attachments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert attachments"
  on public.ad_strategy_memo_attachments for insert
  with check (auth.role() = 'authenticated');

create table if not exists public.ad_strategy_memo_comments (
  id uuid primary key default gen_random_uuid(),
  memo_id uuid not null references public.ad_strategy_memos (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_memo_comments_memo on public.ad_strategy_memo_comments (memo_id, created_at);

alter table public.ad_strategy_memo_comments enable row level security;

create policy "authenticated can select comments"
  on public.ad_strategy_memo_comments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own comments"
  on public.ad_strategy_memo_comments for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

-- 첨부파일 저장용 Storage 버킷 — 비공개(public=false), signed URL로만 다운로드 허용
insert into storage.buckets (id, name, public)
values ('memo-attachments', 'memo-attachments', false)
on conflict (id) do nothing;

create policy "authenticated can upload memo attachments"
  on storage.objects for insert
  with check (bucket_id = 'memo-attachments' and auth.role() = 'authenticated');

create policy "authenticated can read memo attachments"
  on storage.objects for select
  using (bucket_id = 'memo-attachments' and auth.role() = 'authenticated');
