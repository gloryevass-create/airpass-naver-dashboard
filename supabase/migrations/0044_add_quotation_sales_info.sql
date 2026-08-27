-- ============================================================================
-- 견적서에 WHIZZUP 레퍼런스의 "영업 정보(SALES INFO)" 패널을 추가한다 — 협업
-- 구분(직영/컨소)과 내부용 수익 분석, 임시저장/최종저장 상태 구분(사용자 확인,
-- 2026-08-27, 처음엔 내부원가·마진 추적을 스코프에서 뺐다가 이번에 다시 요청받음).
-- 이 정보는 견적서 화면(작성 폼)에서만 보이고 인쇄용 화면(QuotationPrintView)에는
-- 애초에 이 컬럼을 조회·전달하지 않는 방식으로 절대 노출되지 않게 한다.
-- ============================================================================

alter table public.quotations
  add column if not exists execution_type text not null default '직영'
    check (execution_type in ('직영', '컨소', '해당없음')),
  add column if not exists consortium_company text,
  add column if not exists consortium_rate numeric not null default 0,
  add column if not exists extra_internal_cost numeric not null default 0,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'final'));
