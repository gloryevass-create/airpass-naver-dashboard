-- ============================================================================
-- 팀일정2 → 개인 구글 캘린더 등록 연동(2026-08-29, calendar.events 스코프 추가에
-- 맞춰 읽기 전용이던 구글 캘린더 연동을 쓰기까지 확장). team_events_v2는 팀
-- 전체가 공유하는 일정이라, 이 일정을 "내 구글 캘린더에도 등록"한 사람(작성자
-- 또는 이후 수정자 한 명)만 그 대응되는 구글 이벤트 id를 추적한다 — 여러
-- 사람이 각자의 캘린더에 동시에 등록하는 것까지는 지원하지 않는다(과설계
-- 방지, 팀 규모상 충분).
--
-- google_event_owner_id가 가리키는 사용자만 이후 수정/삭제 시 그 사람의
-- google_calendar_connections 토큰으로 구글 이벤트도 같이 갱신/삭제한다.
-- 다른 사용자가 이 일정을 수정해도 google_event_owner_id가 그대로 남아있으면
-- 구글 쪽은 건드리지 않는다(권한 없는 남의 캘린더에 쓸 수 없으므로).
-- ============================================================================

alter table public.team_events_v2
  add column if not exists google_event_id text,
  add column if not exists google_event_owner_id uuid references auth.users (id) on delete set null;
