import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

/** 담당자 선택 목록용 팀원 이름. 기존 담당자 필드들(사업/협업/마케팅업무/일정)이
 * 전부 "이름"만 자유 텍스트로 저장해온 값과 형식을 그대로 맞추기 위해(직함 없이)
 * profiles.name만 조회한다 — DB 스키마·기존 저장값은 바꾸지 않고 입력 방식만
 * 자유 입력에서 실제 팀원 목록 선택으로 바꾼다(사용자 확인, 2026-08-23). */
export async function getTeamMemberNames(supabase: Client): Promise<string[]> {
  const { data } = await supabase.from("profiles").select("name").order("name", { ascending: true });
  return Array.from(new Set((data ?? []).map((p) => p.name).filter((n): n is string => Boolean(n))));
}
