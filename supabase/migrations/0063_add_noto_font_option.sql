-- ============================================================================
-- profiles.font_preference에 'noto'(본고딕/Noto Sans KR) 선택지 추가(2026-09-08).
-- 0061/0062와 같은 이유로 check 제약을 지우고 다시 만든다.
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_font_preference_check;
alter table public.profiles
  add constraint profiles_font_preference_check
  check (font_preference in ('pretendard', 'system', 'gmarket', 'nanumsquare', 'noto'));
