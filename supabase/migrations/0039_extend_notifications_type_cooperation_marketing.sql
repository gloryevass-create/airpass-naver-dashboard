-- ============================================================================
-- SI Business·Calendar·Cooperation·Marketing 새 항목 등록 시에도 팀 알림 피드에
-- 남긴다(사용자 확인, 2026-08-23 — 새 항목 등록 시만, 상태 변경은 알림 없음).
--
-- SI Business/Calendar는 기존 'business'/'event' 타입을 그대로 재사용한다 —
-- 옛 Notion 미러링 파이프라인(business_projects/team_events, Track K/E)이 이미
-- 제거되어 더 이상 이 타입으로 알림을 만들지 않으므로 재사용해도 의미가 겹치지
-- 않는다. Cooperation/Marketing은 완전히 새 영역이라 타입을 새로 추가한다.
-- ============================================================================

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in (
      'event', 'business', 'youtube', 'budget_low', 'memo', 'budget_scrap', 'prespec_scrap',
      'news_scrap', 'cooperation', 'marketing'
    )
  );
