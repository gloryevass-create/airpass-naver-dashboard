-- ============================================================================
-- profiles에 google_email(개인 구글 이메일) 추가 — 로그인/회사 이메일(email)과는
-- 별개로, 회원정보 수정 화면에서 본인이 직접 입력하는 참고용 필드다.
-- RLS self-update 정책은 추가하지 않는다 — role 자기승격을 막기 위해 이미
-- 의도적으로 없앤 상태(app/login/actions.ts의 recordLogin 참고)를 그대로
-- 유지하고, 회원정보 수정도 같은 방식(admin/service_role 클라이언트로
-- title/google_email 두 컬럼만 갱신)으로 처리한다.
-- ============================================================================

alter table public.profiles add column if not exists google_email text;
