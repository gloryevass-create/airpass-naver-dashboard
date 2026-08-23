"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import type { MemoCategory } from "@/lib/queries/memos";
import { formatMember } from "@/lib/formatMember";

const CATEGORIES: MemoCategory[] = ["keyword", "blog", "etc"];

// 협력사 서류 첨부(vendors.ts)와 동일한 크기 상한(12MB)을 쓰되, 메모는 스크린샷·
// 기획서·시트 등 더 다양한 자료가 붙으므로 MIME 화이트리스트는 이미지/PDF/오피스
// 문서/ZIP까지 넓게 잡는다. 이전에는 크기·형식 제한이 전혀 없었고 업로드 실패가
// 조용히 무시돼(`continue`) 사용자가 원인을 알 수 없었다 — 이제 저장 전에 미리
// 걸러 에러를 보여준다(사용자 확인, 2026-08-23).
const MEMO_ATTACHMENT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
];
const MEMO_ATTACHMENT_MAX_SIZE = 12 * 1024 * 1024;
const MEMO_ATTACHMENT_MAX_COUNT = 5;

/** 업로드 시도 전에 미리 검증해서, 저장 실패가 조용히 무시되지 않고 사용자에게
 * 명확한 이유와 함께 보이게 한다. 하나라도 걸리면 전체 저장을 막는다(부분 저장 방지). */
function validateMemoFiles(files: File[]): string | null {
  if (files.length > MEMO_ATTACHMENT_MAX_COUNT) {
    return `첨부파일은 한 번에 최대 ${MEMO_ATTACHMENT_MAX_COUNT}개까지 올릴 수 있습니다.`;
  }
  for (const file of files) {
    if (!MEMO_ATTACHMENT_ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: 이미지·PDF·Office 문서·ZIP 파일만 올릴 수 있습니다.`;
    }
    if (file.size > MEMO_ATTACHMENT_MAX_SIZE) {
      return `${file.name}: 파일은 12MB 이하만 올릴 수 있습니다.`;
    }
  }
  return null;
}

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

  const fileError = validateMemoFiles(files);
  if (fileError) return { error: fileError };

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

  let attachmentFailed = false;
  for (const file of files) {
    const path = `${memo.id}/${randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("memo-attachments").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) {
      attachmentFailed = true;
      console.error(`[createMemo] 첨부파일 업로드 실패 (${file.name}):`, uploadError.message);
      continue;
    }

    await supabase.from("ad_strategy_memo_attachments").insert({
      memo_id: memo.id,
      file_name: file.name,
      storage_path: path,
      file_size: file.size,
    });
  }

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();
  const actor = formatMember(profile?.name ?? null, null, profile?.email ?? user.email ?? "");
  await supabase.from("notifications").insert({
    type: "memo",
    title,
    message: `${actor}님이 광고전략메모를 작성했습니다.`,
    link: `/dashboard/memos/${memo.id}`,
  });

  revalidatePath("/dashboard/memos");
  redirect(`/dashboard/memos/${memo.id}${attachmentFailed ? "?attachmentError=1" : ""}`);
}

async function canModifyMemo(
  supabase: Awaited<ReturnType<typeof requireAuthedClient>>["supabase"],
  userId: string,
  memoId: string
): Promise<{ allowed: boolean; authorId?: string }> {
  const { data: memo } = await supabase
    .from("ad_strategy_memos")
    .select("author_id")
    .eq("id", memoId)
    .maybeSingle();
  if (!memo) return { allowed: false };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const allowed = memo.author_id === userId || profile?.role === "admin";
  return { allowed, authorId: memo.author_id };
}

export type UpdateMemoState = { error?: string } | undefined;

export async function updateMemo(
  memoId: string,
  _prevState: UpdateMemoState,
  formData: FormData
): Promise<UpdateMemoState> {
  const { supabase, user } = await requireAuthedClient();

  const { allowed } = await canModifyMemo(supabase, user.id, memoId);
  if (!allowed) return { error: "본인이 작성한 메모만 수정할 수 있습니다." };

  const category = String(formData.get("category") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const removeAttachmentIds = formData.getAll("removeAttachments").map(String);

  if (!CATEGORIES.includes(category as MemoCategory)) {
    return { error: "구분을 선택하세요." };
  }
  if (!title) return { error: "제목을 입력하세요." };
  if (!content) return { error: "내용을 입력하세요." };

  const fileError = validateMemoFiles(files);
  if (fileError) return { error: fileError };

  const { error } = await supabase
    .from("ad_strategy_memos")
    .update({ category: category as MemoCategory, title, content })
    .eq("id", memoId);

  if (error) return { error: `수정 실패: ${error.message}` };

  if (removeAttachmentIds.length > 0) {
    const { data: toRemove } = await supabase
      .from("ad_strategy_memo_attachments")
      .select("id, storage_path")
      .in("id", removeAttachmentIds);
    if (toRemove?.length) {
      await supabase.storage.from("memo-attachments").remove(toRemove.map((a) => a.storage_path));
      await supabase
        .from("ad_strategy_memo_attachments")
        .delete()
        .in(
          "id",
          toRemove.map((a) => a.id)
        );
    }
  }

  let attachmentFailed = false;
  for (const file of files) {
    const path = `${memoId}/${randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("memo-attachments").upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) {
      attachmentFailed = true;
      console.error(`[updateMemo] 첨부파일 업로드 실패 (${file.name}):`, uploadError.message);
      continue;
    }

    await supabase.from("ad_strategy_memo_attachments").insert({
      memo_id: memoId,
      file_name: file.name,
      storage_path: path,
      file_size: file.size,
    });
  }

  revalidatePath(`/dashboard/memos/${memoId}`);
  revalidatePath("/dashboard/memos");
  redirect(`/dashboard/memos/${memoId}${attachmentFailed ? "?attachmentError=1" : ""}`);
}

// formData는 폼 action 시그니처를 맞추기 위해서만 받는다(내용은 쓰지 않음).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteMemo(memoId: string, formData: FormData): Promise<void> {
  const { supabase, user } = await requireAuthedClient();

  const { allowed } = await canModifyMemo(supabase, user.id, memoId);
  if (!allowed) redirect(`/dashboard/memos/${memoId}`);

  const { data: attachments } = await supabase
    .from("ad_strategy_memo_attachments")
    .select("storage_path")
    .eq("memo_id", memoId);
  if (attachments?.length) {
    await supabase.storage.from("memo-attachments").remove(attachments.map((a) => a.storage_path));
  }

  await supabase.from("ad_strategy_memos").delete().eq("id", memoId);

  revalidatePath("/dashboard/memos");
  redirect("/dashboard/memos");
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
