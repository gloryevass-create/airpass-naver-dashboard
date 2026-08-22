"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

const PATH = "/dashboard/business2";

export type BusinessProjectV2FormState = { error?: string } | undefined;

function text(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

function numberOrNull(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw ? Number(raw) : null;
}

function dateOrNull(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function assigneesFromForm(formData: FormData): string[] {
  const raw = String(formData.get("assignees") ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fieldsFromForm(formData: FormData) {
  return {
    title: text(formData, "title") ?? "",
    stage: text(formData, "stage"),
    status: text(formData, "status") ?? "시작 전",
    org_name: text(formData, "orgName"),
    participation_type: text(formData, "participationType"),
    work_type: text(formData, "workType"),
    result: text(formData, "result"),
    amount: numberOrNull(formData, "amount"),
    progress_rate: numberOrNull(formData, "progressRate"),
    submission_date: dateOrNull(formData, "submissionDate"),
    submission_method: text(formData, "submissionMethod"),
    presentation_date: dateOrNull(formData, "presentationDate"),
    construction_start: dateOrNull(formData, "constructionStart"),
    construction_end: dateOrNull(formData, "constructionEnd"),
    construction_content: text(formData, "constructionContent"),
    assignees: assigneesFromForm(formData),
    notes: text(formData, "notes"),
  };
}

export async function createBusinessProjectV2(
  _prevState: BusinessProjectV2FormState,
  formData: FormData
): Promise<BusinessProjectV2FormState> {
  const { supabase } = await requireAuthedClient();

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "사업명을 입력하세요." };

  const { error } = await supabase.from("business_projects_v2").insert(fields);
  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function updateBusinessProjectV2(
  _prevState: BusinessProjectV2FormState,
  formData: FormData
): Promise<BusinessProjectV2FormState> {
  const { supabase } = await requireAuthedClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "잘못된 요청입니다." };

  const fields = fieldsFromForm(formData);
  if (!fields.title) return { error: "사업명을 입력하세요." };

  const { error } = await supabase
    .from("business_projects_v2")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteBusinessProjectV2(id: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("business_projects_v2").delete().eq("id", id);
  revalidatePath(PATH);
}

/** 카드에서 바로 단계를 옮길 때 쓰는 가벼운 액션(전체 폼을 열지 않아도 됨). */
export async function moveBusinessProjectV2Stage(id: string, stage: string | null): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase
    .from("business_projects_v2")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(PATH);
}

export type BusinessProjectV2CommentState = { error?: string } | undefined;

export async function createBusinessProjectV2Comment(
  projectId: string,
  _prevState: BusinessProjectV2CommentState,
  formData: FormData
): Promise<BusinessProjectV2CommentState> {
  const { supabase, user } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "댓글 내용을 입력하세요." };

  const { error } = await supabase.from("business_projects_v2_comments").insert({
    project_id: projectId,
    author_id: user.id,
    author_email: user.email ?? "",
    content,
  });

  if (error) return { error: `댓글 저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteBusinessProjectV2Comment(commentId: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  await supabase.from("business_projects_v2_comments").delete().eq("id", commentId);
  revalidatePath(PATH);
}

export type BusinessProjectV2HistoryState = { error?: string } | undefined;

/** 히스토리는 댓글과 달리 삭제 기능을 두지 않는다 — 변경 이력을 그대로 보존하는 것이 목적. */
export async function createBusinessProjectV2HistoryEntry(
  projectId: string,
  _prevState: BusinessProjectV2HistoryState,
  formData: FormData
): Promise<BusinessProjectV2HistoryState> {
  const { supabase, user } = await requireAuthedClient();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "히스토리 내용을 입력하세요." };

  const { error } = await supabase.from("business_projects_v2_history").insert({
    project_id: projectId,
    author_id: user.id,
    author_email: user.email ?? "",
    content,
  });

  if (error) return { error: `히스토리 저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}
