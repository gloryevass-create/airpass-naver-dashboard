-- ============================================================================
-- 견적서를 SI Business(business_projects_v2) 프로젝트에 연결한다(사용자 확인
-- 2026-08-27) — 견적서 작성 화면에서 프로젝트를 검색해 골라 두면, 그 프로젝트
-- 상세 화면에서도 연결된 견적서 목록을 확인할 수 있다. 프로젝트가 삭제되면
-- 견적서 자체는 남기고 연결만 끊는다(on delete set null).
-- ============================================================================

alter table public.quotations
  add column if not exists business_project_id uuid references public.business_projects_v2(id) on delete set null;
