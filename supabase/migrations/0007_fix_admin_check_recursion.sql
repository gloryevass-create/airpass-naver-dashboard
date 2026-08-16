-- ============================================================================
-- "infinite recursion detected in policy for relation profiles" 수정
--
-- 원인: profiles의 "admins can select all profiles" 정책과 방금 추가한
-- ad_strategy_memos의 수정/삭제 정책이 둘 다 `exists (select 1 from public.profiles
-- where role='admin')` 형태로 profiles를 직접 서브쿼리한다. 이 서브쿼리 자체도
-- profiles의 RLS를 다시 통과해야 하는데, 그 RLS 안에 또 같은 서브쿼리가 있어
-- Postgres가 재귀를 감지하고 에러를 낸다(쿼리 플랜에 따라 짧은 회로가 걸릴 때도
-- 있고 아닐 때도 있어 이전에는 우연히 안 걸렸을 뿐 근본적으로 잘못된 패턴이었다).
--
-- 해법: SECURITY DEFINER 함수로 관리자 여부를 확인한다 — 이 함수는 소유자
-- 권한으로 실행되어 RLS를 다시 타지 않으므로 재귀가 원천적으로 불가능하다.
-- (Supabase 공식 권장 패턴.)
-- ============================================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

drop policy if exists "admins can select all profiles" on public.profiles;
create policy "admins can select all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

drop policy if exists "author or admin can update memos" on public.ad_strategy_memos;
create policy "author or admin can update memos"
  on public.ad_strategy_memos for update
  using (
    auth.role() = 'authenticated'
    and (author_id = auth.uid() or public.is_admin(auth.uid()))
  );

drop policy if exists "author or admin can delete memos" on public.ad_strategy_memos;
create policy "author or admin can delete memos"
  on public.ad_strategy_memos for delete
  using (
    auth.role() = 'authenticated'
    and (author_id = auth.uid() or public.is_admin(auth.uid()))
  );
