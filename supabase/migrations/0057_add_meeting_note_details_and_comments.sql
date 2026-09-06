-- ============================================================================
-- Meeting Notes 확장(2026-09-06) — 미팅 참석자·장소 필드 추가, 팀원 의견(댓글)
-- 기능 추가. 댓글은 ad_strategy_memo_comments와 완전히 같은 패턴이다.
-- ============================================================================

alter table public.meeting_notes add column if not exists attendees text;
alter table public.meeting_notes add column if not exists location text;

create table if not exists public.meeting_note_comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.meeting_notes (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_note_comments_note on public.meeting_note_comments (note_id, created_at);

alter table public.meeting_note_comments enable row level security;

create policy "authenticated can select meeting note comments"
  on public.meeting_note_comments for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own meeting note comments"
  on public.meeting_note_comments for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

-- 개별 댓글 삭제 UI는 없다 — 이 정책은 미팅노트 삭제 시 cascade가 RLS에
-- 막히지 않게 하기 위한 것(ad_strategy_memo_comments와 동일한 이유).
create policy "authenticated can delete meeting note comments"
  on public.meeting_note_comments for delete
  using (auth.role() = 'authenticated');
