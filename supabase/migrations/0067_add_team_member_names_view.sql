-- ============================================================================
-- 담당자 선택 목록(팀원 이름)이 member 권한 사용자에게는 본인 이름 하나만
-- 보이던 버그 수정(2026-09-09).
--
-- 원인: profiles의 select RLS 정책이 "본인 행"(select own profile) 또는
-- "관리자면 전체"(admins can select all profiles)만 허용해서, member 권한
-- 사용자가 lib/queries/teamMembers.ts::getTeamMemberNames()로 조회하면 본인
-- 행 하나만 돌아왔다 — SI Business/Cooperation/Marketing/Work Journal/Calendar
-- 등 담당자 다중선택(ManagerChips/MemberMultiSelect)을 쓰는 모든 화면이 같은
-- 문제를 겪는다.
--
-- profiles 테이블 자체의 select 정책을 전체 열람으로 넓히면 이메일·핸드폰번호·
-- 구글메일·최근 로그인 IP 같은 민감 컬럼까지 팀 전체에 노출된다. 대신 id/name
-- 두 컬럼만 내보내는 뷰를 하나 만들고, 이 뷰는 정의자(뷰 생성자) 권한으로
-- 실행돼 기반 테이블의 RLS를 우회한다(뷰의 표준 컬럼 마스킹 패턴) — 그래서
-- authenticated 누구나 이 뷰로는 이름만 보고, profiles 테이블 자체는 그대로
-- 잠긴 채로 남는다.
-- ============================================================================

create or replace view public.team_member_names as
  select id, name from public.profiles;

grant select on public.team_member_names to authenticated;
