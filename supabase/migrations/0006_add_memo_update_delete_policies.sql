-- ============================================================================
-- 광고전략메모 수정·삭제 권한
--
-- 작성자 본인 또는 관리자(profiles.role='admin')만 수정·삭제할 수 있다.
-- 첨부파일·댓글 테이블에도 DELETE 정책이 있어야 하는 이유: 메모를 삭제하면
-- FK의 on delete cascade로 자식 행이 함께 삭제되는데, 이 cascade는 요청을 보낸
-- authenticated 역할로 실행되므로 자식 테이블에 DELETE 정책이 없으면 RLS에
-- 막혀 cascade 자체가 실패한다.
-- ============================================================================

create policy "author or admin can update memos"
  on public.ad_strategy_memos for update
  using (
    auth.role() = 'authenticated'
    and (
      author_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

create policy "author or admin can delete memos"
  on public.ad_strategy_memos for delete
  using (
    auth.role() = 'authenticated'
    and (
      author_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

create policy "authenticated can delete attachments"
  on public.ad_strategy_memo_attachments for delete
  using (auth.role() = 'authenticated');

create policy "authenticated can delete comments"
  on public.ad_strategy_memo_comments for delete
  using (auth.role() = 'authenticated');

create policy "authenticated can delete memo attachment files"
  on storage.objects for delete
  using (bucket_id = 'memo-attachments' and auth.role() = 'authenticated');
