"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

const PATH = "/dashboard/account/profile";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SmtpAccountState = { error?: string; success?: boolean } | undefined;

// material_email_smtp_accounts는 google_calendar_connections(0050)와 같은
// 이유로 admin(service_role) 클라이언트 없이 세션 클라이언트 + self-row RLS로
// 바로 CRUD한다 — 본인 행만 건드릴 수 있어 profiles.role 같은 권한상승
// 위험이 없다.
export async function saveMaterialEmailSmtpAccount(
  _prevState: SmtpAccountState,
  formData: FormData
): Promise<SmtpAccountState> {
  const { supabase, user } = await requireAuthedClient();

  const smtpUser = String(formData.get("smtpUser") ?? "").trim();
  const smtpPassword = String(formData.get("smtpPassword") ?? "");

  if (!smtpUser) return { error: "SMTP 계정 이메일을 입력하세요." };
  if (!EMAIL_RE.test(smtpUser)) return { error: "이메일 형식이 올바르지 않습니다." };

  if (!smtpPassword) {
    // 비밀번호를 비워두고 제출하면 "이메일만 갱신, 비밀번호는 유지" —
    // 이미 등록된 계정이 있을 때만 허용한다(처음 등록할 땐 비밀번호 필수).
    const { data: existing } = await supabase
      .from("material_email_smtp_accounts")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing) return { error: "비밀번호를 입력하세요." };

    const { error } = await supabase.from("material_email_smtp_accounts").update({ smtp_user: smtpUser }).eq("user_id", user.id);
    if (error) return { error: `저장 실패: ${error.message}` };
    revalidatePath(PATH);
    return { success: true };
  }

  const { error } = await supabase
    .from("material_email_smtp_accounts")
    .upsert({ user_id: user.id, smtp_user: smtpUser, smtp_password: smtpPassword }, { onConflict: "user_id" });
  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return { success: true };
}

export async function deleteMaterialEmailSmtpAccount(): Promise<void> {
  const { supabase, user } = await requireAuthedClient();
  await supabase.from("material_email_smtp_accounts").delete().eq("user_id", user.id);
  revalidatePath(PATH);
}
