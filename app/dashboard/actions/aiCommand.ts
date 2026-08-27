"use server";

import { requireAuthedClient } from "@/lib/supabase/authed";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { runAiCommand as runAiCommandCore, type AiCommandResult, type AiCommandTurn } from "@/lib/aiCommand";

// "use server" 파일은 async 함수 외의 export를 허용하지 않아(번들러가 전체 export를
// 무효화함) maxDuration을 여기서 직접 지정할 수 없다 — 대신 클라이언트(AiCommandBar)가
// 서버 응답을 일정 시간 넘게 기다리면 스스로 실패로 확정하는 타임아웃을 두어, 플랫폼이
// 함수를 조용히 종료하거나 응답이 없어도 "처리 중" 상태에 영영 멈추지 않게 한다
// (사용자 확인, 2026-08-27).

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
