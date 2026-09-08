-- ============================================================================
-- profiles에 font_preference(개인별 폰트 설정) 추가(2026-09-08) — 앱 전체를
-- Pretendard로 통일한 뒤, 개인이 원하면 자기 화면만 시스템 기본 폰트로 되돌릴
-- 수 있게 한다. phone/google_email(0048/0053)과 같은 방식: 본인이 회원정보
-- 수정 화면에서 직접 바꾼다.
-- ============================================================================

alter table public.profiles
  add column if not exists font_preference text not null default 'pretendard'
  check (font_preference in ('pretendard', 'system'));
