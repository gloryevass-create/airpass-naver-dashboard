-- ============================================================================
-- profiles.font_preference에 'gmarket'(G마켓 산스) 선택지 추가(2026-09-08).
-- 0060에서 만든 check 제약을 그대로 넓힌다 — Postgres는 check 제약을 in-place로
-- 못 고치므로 지우고 다시 만든다.
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_font_preference_check;
alter table public.profiles
  add constraint profiles_font_preference_check
  check (font_preference in ('pretendard', 'system', 'gmarket'));
