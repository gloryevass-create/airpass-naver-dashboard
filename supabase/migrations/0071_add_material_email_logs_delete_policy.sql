-- material_email_logs는 원래 SELECT/INSERT 정책만 있고 DELETE는 아예 막혀
-- 있었다 — 발송이력 삭제 기능(2026-09-12) 추가하면서 admin만 삭제 가능하도록
-- public.is_admin() 헬퍼(0007)를 재사용해 DELETE 정책을 새로 연다.
create policy "admin can delete material email logs"
  on public.material_email_logs for delete
  using (public.is_admin(auth.uid()));
