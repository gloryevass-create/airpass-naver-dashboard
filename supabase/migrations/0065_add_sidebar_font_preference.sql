-- ============================================================================
-- profiles에 sidebar_font_preference(사이드바 전용 개인 폰트 설정) 추가(2026-09-08)
-- — font_preference(본문)와 별개로 사이드바만 다른 폰트로 볼 수 있게 한다.
-- 허용 값은 font_preference와 동일(0060~0064 참고).
-- ============================================================================

alter table public.profiles
  add column if not exists sidebar_font_preference text not null default 'pretendard';

alter table public.profiles drop constraint if exists profiles_sidebar_font_preference_check;
alter table public.profiles
  add constraint profiles_sidebar_font_preference_check
  check (sidebar_font_preference in ('pretendard', 'system', 'gmarket', 'nanumsquare', 'noto', 'omudaye'));
