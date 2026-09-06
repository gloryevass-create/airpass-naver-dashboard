"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

const PATH = "/dashboard/ai-tools";

export type AiToolFormState = { error?: string } | undefined;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function canModifyTool(
  supabase: Awaited<ReturnType<typeof requireAuthedClient>>["supabase"],
  userId: string,
  toolId: string
): Promise<boolean> {
  const { data: tool } = await supabase.from("ai_tools").select("author_id").eq("id", toolId).maybeSingle();
  if (!tool) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return tool.author_id === userId || profile?.role === "admin";
}

export async function createAiTool(_prevState: AiToolFormState, formData: FormData): Promise<AiToolFormState> {
  const { supabase, user } = await requireAuthedClient();

  const title = String(formData.get("title") ?? "").trim();
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title) return { error: "제목을 입력하세요." };
  if (!url) return { error: "링크를 입력하세요." };

  const { error } = await supabase.from("ai_tools").insert({
    author_id: user.id,
    author_email: user.email ?? "",
    title,
    url,
    description,
  });
  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function updateAiTool(
  toolId: string,
  _prevState: AiToolFormState,
  formData: FormData
): Promise<AiToolFormState> {
  const { supabase, user } = await requireAuthedClient();

  if (!(await canModifyTool(supabase, user.id, toolId))) {
    return { error: "본인이 등록한 링크만 수정할 수 있습니다." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title) return { error: "제목을 입력하세요." };
  if (!url) return { error: "링크를 입력하세요." };

  const { error } = await supabase
    .from("ai_tools")
    .update({ title, url, description, updated_at: new Date().toISOString() })
    .eq("id", toolId);
  if (error) return { error: `수정 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteAiTool(toolId: string): Promise<void> {
  const { supabase, user } = await requireAuthedClient();

  if (!(await canModifyTool(supabase, user.id, toolId))) return;

  await supabase.from("ai_tools").delete().eq("id", toolId);
  revalidatePath(PATH);
}
