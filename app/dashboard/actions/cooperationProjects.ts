"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

const PATH = "/dashboard/cooperation";

export type CooperationProjectFormState = { error?: string } | undefined;

function text(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function dateOrNull(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function listFromForm(formData: FormData, key: string): string[] {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fieldsFromForm(formData: FormData) {
  return {
    title: text(formData, "title") ?? "",
    company: text(formData, "company"),
    relation_type: text(formData, "relationType"),
    work_type: text(formData, "workType"),
    status: text(formData, "status") ?? "시작 전",
    project_start_date: dateOrNull(formData, "projectStartDate"),
    project_end_date: dateOrNull(formData, "projectEndDate"),
    main_assignees: listFromForm(formData, "mainAssignees"),
    sub_assignees: listFromForm(formData, "subAssignees"),
    content: text(formData, "content"),
    ai_keywords: text(formData, "aiKeywords"),
  };
}

export async function createCooperationProject(
  _prevState: CooperationProjectFormState,
  formData: FormData
): Promise<CooperationProjectFormState> {
  const { supabase } = await requireAuthedClient();

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "협업 이름을 입력하세요." };

  const { error } = await supabase.from("cooperation_projects").insert(fields);
  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function updateCooperationProject(
  _prevState: CooperationProjectFormState,
  formData: FormData
): Promise<CooperationProjectFormState> {
  const { supabase } = await requireAuthedClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "협업 이름을 입력하세요." };

  const { error } = await supabase
    .from("cooperation_projects")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteCooperationProject(id: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("cooperation_projects").delete().eq("id", id);
  revalidatePath(PATH);
}

/** 카드에서 바로 관계(칸반 컬럼)를 옮길 때 쓰는 가벼운 액션(전체 폼을 열지 않아도 됨). */
export async function moveCooperationProjectRelation(id: string, relationType: string | null): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase
    .from("cooperation_projects")
    .update({ relation_type: relationType, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(PATH);
}

export type CooperationProjectCommentState = { error?: string } | undefined;

export async function createCooperationProjectComment(
  projectId: string,
  _prevState: CooperationProjectCommentState,
  formData: FormData
): Promise<CooperationProjectCommentState> {
  const { supabase, user } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "댓글 내용을 입력하세요." };

  const { error } = await supabase.from("cooperation_projects_comments").insert({
    project_id: projectId,
    author_id: user.id,
    author_email: user.email ?? "",
    content,
  });

  if (error) return { error: `댓글 저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteCooperationProjectComment(commentId: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("cooperation_projects_comments").delete().eq("id", commentId);
  revalidatePath(PATH);
}

export type CooperationProjectHistoryState = { error?: string } | undefined;

/** 히스토리는 댓글과 달리 삭제 기능을 두지 않는다 — 기록 자체가 사라지는 것을 막기 위함.
 * 다만 작성자 본인은 오탈자·내용을 바로잡을 수 있도록 수정은 허용한다. */
export async function createCooperationProjectHistoryEntry(
  projectId: string,
  _prevState: CooperationProjectHistoryState,
  formData: FormData
): Promise<CooperationProjectHistoryState> {
  const { supabase, user } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "히스토리 내용을 입력하세요." };

  const { error } = await supabase.from("cooperation_projects_history").insert({
    project_id: projectId,
    author_id: user.id,
    author_email: user.email ?? "",
    content,
  });

  if (error) return { error: `히스토리 저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function updateCooperationProjectHistoryEntry(
  historyId: string,
  _prevState: CooperationProjectHistoryState,
  formData: FormData
): Promise<CooperationProjectHistoryState> {
  const { supabase } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "히스토리 내용을 입력하세요." };

  const { error } = await supabase
    .from("cooperation_projects_history")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", historyId);

  if (error) return { error: `히스토리 수정 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}
