-- ============================================================================
-- Memo Board(ad_strategy_memos) "구분" 값을 키워드/블로그/기타에서
-- SI Business/Cooperation/Marketing/etc로 교체한다(사용자 확인, 2026-08-24).
-- WORKSPACE 그룹 메뉴(SI Business/Cooperation/Marketing)와 맞춰, 어떤
-- 업무 영역에 대한 메모인지로 구분 기준을 바꾼 것 — 메모 내용 자체와는 무관.
--
-- 기존 값이 있는 행은(전부 keyword/blog/etc였던 과거 구분이라 새 기준으로
-- 자동 매핑할 수 없음) marketing으로 옮긴다(사용자 확인 — 기존 메모 1건은
-- Marketing으로 분류).
-- ============================================================================

alter table public.ad_strategy_memos drop constraint ad_strategy_memos_category_check;

update public.ad_strategy_memos
set category = 'marketing'
where category in ('keyword', 'blog', 'etc');

alter table public.ad_strategy_memos
  add constraint ad_strategy_memos_category_check
  check (category in ('business', 'cooperation', 'marketing', 'etc'));
