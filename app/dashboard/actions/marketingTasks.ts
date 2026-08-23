"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { formatMember } from "@/lib/formatMember";

const PATH = "/dashboard/marketing-tasks";

export type MarketingTaskFormState = { error?: string } | undefined;

function text(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function dateOrNull(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

// MemberMultiSelect가 같은 name으로 여러 값을 제출하므로 getAll로 받는다
// (예전 "쉼표로 구분" 자유 텍스트 입력을 실제 팀원 선택으로 대체, 2026-08-23).
function listFromForm(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String).filter(Boolean);
}

function fieldsFromForm(formData: FormData) {
  return {
    title: text(formData, "title") ?? "",
    content: text(formData, "content"),
    category: text(formData, "category"),
    work_type: text(formData, "workType"),
    stage: text(formData, "stage"),
    status: text(formData, "status") ?? "시작 전",
    due_date: dateOrNull(formData, "dueDate"),
    due_date_end: dateOrNull(formData, "dueDateEnd"),
    assignees: listFromForm(formData, "assignees"),
  };
}

export async function createMarketingTask(
  _prevState: MarketingTaskFormState,
  formData: FormData
): Promise<MarketingTaskFormState> {
  const { supabase, user } = await requireAuthedClient();

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "업무명을 입력하세요." };

  const { error } = await supabase.from("marketing_tasks").insert(fields);
  if (error) return { error: `저장 실패: ${error.message}` };

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();
  const actor = formatMember(profile?.name ?? null, null, profile?.email ?? user.email ?? "");
  await supabase.from("notifications").insert({
    type: "marketing",
    title: fields.title,
    message: `${actor}님이 새 마케팅 업무를 등록했습니다.`,
    link: PATH,
  });

  revalidatePath(PATH);
  return undefined;
}

export async function updateMarketingTask(
  _prevState: MarketingTaskFormState,
  formData: FormData
): Promise<MarketingTaskFormState> {
  const { supabase } = await requireAuthedClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "업무명을 입력하세요." };

  const { error } = await supabase
    .from("marketing_tasks")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteMarketingTask(id: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("marketing_tasks").delete().eq("id", id);
  revalidatePath(PATH);
}

/** 카드에서 바로 분류(칸반 컬럼)를 옮길 때 쓰는 가벼운 액션(전체 폼을 열지 않아도 됨). */
export async function moveMarketingTaskCategory(id: string, category: string | null): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase
    .from("marketing_tasks")
    .update({ category, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(PATH);
}

export type MarketingTaskCommentState = { error?: string } | undefined;

export async function createMarketingTaskComment(
  taskId: string,
  _prevState: MarketingTaskCommentState,
  formData: FormData
): Promise<MarketingTaskCommentState> {
  const { supabase, user } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "댓글 내용을 입력하세요." };

  const { error } = await supabase.from("marketing_tasks_comments").insert({
    task_id: taskId,
    author_id: user.id,
    author_email: user.email ?? "",
    content,
  });

  if (error) return { error: `댓글 저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteMarketingTaskComment(commentId: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("marketing_tasks_comments").delete().eq("id", commentId);
  revalidatePath(PATH);
}

export type MarketingTaskHistoryState = { error?: string } | undefined;

/** 히스토리는 댓글과 달리 삭제 기능을 두지 않는다 — 기록 자체가 사라지는 것을 막기 위함.
 * 다만 작성자 본인은 오탈자·내용을 바로잡을 수 있도록 수정은 허용한다. */
export async function createMarketingTaskHistoryEntry(
  taskId: string,
  _prevState: MarketingTaskHistoryState,
  formData: FormData
): Promise<MarketingTaskHistoryState> {
  const { supabase, user } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "히스토리 내용을 입력하세요." };

  const { error } = await supabase.from("marketing_tasks_history").insert({
    task_id: taskId,
    author_id: user.id,
    author_email: user.email ?? "",
    content,
  });

  if (error) return { error: `히스토리 저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function updateMarketingTaskHistoryEntry(
  historyId: string,
  _prevState: MarketingTaskHistoryState,
  formData: FormData
): Promise<MarketingTaskHistoryState> {
  const { supabase } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "히스토리 내용을 입력하세요." };

  const { error } = await supabase
    .from("marketing_tasks_history")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", historyId);

  if (error) return { error: `히스토리 수정 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}
