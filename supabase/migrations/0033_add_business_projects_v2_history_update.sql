-- ============================================================================
-- SI Business 히스토리 — 등록한 본인이 오탈자·내용을 고칠 수 있도록 수정을
-- 허용한다(사용자 확인, 2026-08-24). 삭제는 여전히 불가 — 기록 자체가
-- 없어지는 것과 내용을 바로잡는 것은 다르다. 수정 여부를 구분할 수 있도록
-- updated_at을 추가한다.
-- ============================================================================

alter table public.business_projects_v2_history
  add column if not exists updated_at timestamptz not null default now();

create policy "authenticated can update own business project history"
  on public.business_projects_v2_history for update
  using (auth.role() = 'authenticated' and author_id = auth.uid());
