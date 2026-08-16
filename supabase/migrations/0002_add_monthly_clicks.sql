-- ============================================================================
-- 키워드 평균 월간 클릭수(PC/모바일) 컬럼 추가
--
-- 네이버 검색광고 키워드도구 API(showDetail=1)가 이미 반환하는 값인데
-- (monthlyAvePcClkCnt, monthlyAveMobileClkCnt) 지금까지 저장하지 않고 있었다.
-- ============================================================================

alter table public.keyword_daily_metrics
  add column if not exists monthly_click_pc numeric(10, 2),
  add column if not exists monthly_click_mobile numeric(10, 2);
