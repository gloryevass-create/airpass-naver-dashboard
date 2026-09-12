import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

// 회원정보 수정 화면에 "설정됨: xxx@회사.com" 상태만 보여주기 위한 조회 —
// 비밀번호는 절대 클라이언트로 내려보내지 않는다.
export async function getMySmtpAccountUser(supabase: Client, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("material_email_smtp_accounts")
    .select("smtp_user")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.smtp_user ?? null;
}
