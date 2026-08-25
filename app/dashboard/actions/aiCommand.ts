"use server";

import { requireAuthedClient } from "@/lib/supabase/authed";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { runAiCommand as runAiCommandCore, type AiCommandResult, type AiCommandTurn } from "@/lib/aiCommand";

export type { AiCommandResult, AiCommandTurn } from "@/lib/aiCommand";
export type AiCommandActionResult = AiCommandResult | { error: string };

export async function runAiCommand(message: string, history: AiCommandTurn[]): Promise<AiCommandActionResult> {
  const trimmed = message.trim();
  if (!trimmed) return { error: "내용을 입력하세요." };

  const { supabase, user } = await requireAuthedClient();

  const [{ data: profile }, teamMembers] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    getTeamMemberNames(supabase),
  ]);

  try {
    return await runAiCommandCore(trimmed, history, {
      userName: profile?.name ?? user.email ?? "",
      teamMembers,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI 처리 중 오류가 발생했습니다." };
  }
}
