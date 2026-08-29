-- ============================================================================
-- profiles.role에 'guest' 등급 추가 — 회원등급은 admin/member/guest 3단계.
-- 관리자 등록 폼에서는 admin은 선택지에 없고 member/guest만 고를 수 있다
-- (admin 승격은 이 화면에서 직접 하지 않음).
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'member', 'guest'));
