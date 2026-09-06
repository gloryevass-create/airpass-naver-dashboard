-- ============================================================================
-- Meeting Notes(2026-09-06) — 팀원들이 lilys.ai에서 각자 개별적으로 미팅을
-- 기록하고 있어(계정이 사람마다 따로라 API 연동을 하면 불필요한 남의 기록까지
-- 다 끌려오고, 유저별 계정 연결 문제도 생김), 직접 API 연동 대신 lilys.ai의
-- "MARKDOWN 내보내기" 결과물(.md 파일 업로드 또는 텍스트 붙여넣기)을 이 앱에
-- 붙여넣어 팀 전체가 함께 보는 방식으로 구현한다(사용자 확인).
--
-- 원본 파일(PDF 등)은 저장하지 않고 마크다운 텍스트만 DB text 컬럼에 그대로
-- 저장한다 — 별도 파일 스토리지(Supabase Storage/구글드라이브) 연동이 전혀
-- 필요 없다(용량 걱정 없음, 텍스트라 몇 MB짜리 회의록도 무리 없이 들어감).
--
-- ad_strategy_memos와 같은 패턴(작성자 본인 또는 admin만 수정·삭제,
-- is_admin() SECURITY DEFINER 함수로 재귀 없이 확인).
-- ============================================================================

create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  title text not null,
  meeting_date date,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_meeting_notes_created_at on public.meeting_notes (created_at desc);

alter table public.meeting_notes enable row level security;

create policy "authenticated can select meeting notes"
  on public.meeting_notes for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert own meeting notes"
  on public.meeting_notes for insert
  with check (auth.role() = 'authenticated' and author_id = auth.uid());

create policy "author or admin can update meeting notes"
  on public.meeting_notes for update
  using (
    auth.role() = 'authenticated'
    and (author_id = auth.uid() or public.is_admin(auth.uid()))
  );

create policy "author or admin can delete meeting notes"
  on public.meeting_notes for delete
  using (
    auth.role() = 'authenticated'
    and (author_id = auth.uid() or public.is_admin(auth.uid()))
  );

-- 미팅노트 등록 시 알림 피드(notifications)에 남기려면 type 체크 제약에
-- 'meeting_note'를 추가해야 한다(0043에서 마지막으로 갱신된 제약을 확장).
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'event', 'business', 'youtube', 'budget_low', 'memo', 'budget_scrap', 'prespec_scrap',
      'news_scrap', 'cooperation', 'marketing', 'quotation', 'meeting_note'
    )
  );
