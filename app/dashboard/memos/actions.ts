"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import type { MemoCategory } from "@/lib/queries/memos";

const CATEGORIES: MemoCategory[] = ["keyword", "blog", "etc"];

export type CreateMemoState = { error?: string } | undefined;

export async function createMemo(_prevState: CreateMemoState, formData: FormData): Promise<CreateMemoState> {
  const { supabase, user } = await requireAuthedClient();

  const category = String(formData.get("category") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!CATEGORIES.includes(category as MemoCategory)) {
    return { error: "구분을 선택하세요." };
  }
  if (!title) return { error: "제목을 입력하세요." };
  if (!content) return { error: "내용을 입력하세요." };

  const { data: memo, error } = await supabase
    .from("ad_strategy_memos")
    .insert({
      author_id: user.id,
      author_email: user.email ?? "",
      category: category as MemoCategory,
      title,
      content,
    })
    .select("id")
    .single();

  if (error || !memo) {
    return { error: `저장 실패: ${error?.message ?? "알 수 없는 오류"}` };
  }

  for (const file of files) {
    const path = `${memo.id}/${randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("memo-attachments").upload(path, file);
    if (uploadError) continue; // 첨부 실패해도 게시글 자체는 이미 저장됐으니 계속 진행

    await supabase.from("ad_strategy_memo_attachments").insert({
      memo_id: memo.id,
      file_name: file.name,
      storage_path: path,
      file_size: file.size,
    });
  }

  revalidatePath("/dashboard/memos");
  redirect(`/dashboard/memos/${memo.id}`);
}

export type CreateCommentState = { error?: string } | undefined;

export async function createComment(
  memoId: string,
  _prevState: CreateCommentState,
  formData: FormData
): Promise<CreateCommentState> {
  const { supabase, user } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "댓글 내용을 입력하세요." };

  const { error } = await supabase.from("ad_strategy_memo_comments").insert({
    memo_id: memoId,
    author_id: user.id,
    author_email: user.email ?? "",
    content,
  });

  if (error) return { error: `댓글 저장 실패: ${error.message}` };

  revalidatePath(`/dashboard/memos/${memoId}`);
  return undefined;
}
