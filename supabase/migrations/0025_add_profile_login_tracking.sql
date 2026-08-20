-- ============================================================================
-- 로그인 시각·접속 IP 기록 — 관리자 "가입자 목록"에서 팀원의 최근 로그인 활동을
-- 확인할 수 있도록 profiles에 컬럼을 추가한다.
--
-- 갱신은 로그인 성공 직후 서버 액션(app/login/actions.ts::recordLogin)이
-- service_role(admin) 클라이언트로 자신의 행만 업데이트한다 — profiles에는
-- authenticated용 update 정책이 없으므로(role 컬럼까지 같이 있어 자기 자신의
-- role을 admin으로 바꿔치기하는 걸 막기 위해 의도적으로 없음) 이 컬럼들도
-- 같은 이유로 self-service update 정책을 추가하지 않는다.
-- ============================================================================

alter table public.profiles
  add column if not exists last_login_at timestamptz,
  add column if not exists last_login_ip text;
