-- ============================================================================
-- 교육관련뉴스(news_articles)에도 조달입찰공고/사전규격과 동일한 스크랩 기능을
-- 추가한다. notice_scraps.notice_type과 notifications.type의 check 제약을
-- 각각 'news'/'news_scrap' 값을 허용하도록 넓힌다(check 제약은 컬럼을 안 건드리는
-- alter라 값 데이터 손실 없이 바로 적용된다).
-- ============================================================================

alter table public.notice_scraps drop constraint notice_scraps_notice_type_check;
alter table public.notice_scraps
  add constraint notice_scraps_notice_type_check check (notice_type in ('budget', 'prespec', 'news'));

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in ('event', 'business', 'youtube', 'budget_low', 'memo', 'budget_scrap', 'prespec_scrap', 'news_scrap')
  );
