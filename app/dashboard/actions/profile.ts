"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { createAdminClient } from "@/lib/supabase/admin";

const PATH = "/dashboard/account/profile";

export type UpdateProfileState = { error?: string; success?: boolean } | undefined;

/** profiles에는 의도적으로 authenticated self-update RLS 정책이 없다(같은 행의
 * role을 사용자가 스스로 admin으로 바꿔치기하는 걸 막기 위해 — app/login/actions.ts의
 * recordLogin과 동일한 이유). 그래서 여기서도 세션 클라이언트로 "본인이 맞는지"만
 * 확인한 뒤, admin(service_role) 클라이언트로 title/google_email/phone 세 컬럼만
 * 골라서 갱신한다 — role·email·name 등은 이 액션이 절대 건드리지 않는다. */
export async function updateOwnProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const { user } = await requireAuthedClient();

  const title = String(formData.get("title") ?? "").trim() || null;
  const googleEmail = String(formData.get("googleEmail") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (googleEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(googleEmail)) {
    return { error: "구글 이메일 형식이 올바르지 않습니다." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ title, google_email: googleEmail, phone })
    .eq("id", user.id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return { success: true };
}
