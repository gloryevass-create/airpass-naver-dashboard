"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { createAdminClient } from "@/lib/supabase/admin";
import { FONT_OPTIONS, type FontPreferenceId } from "@/lib/fontPreferences";

const PATH = "/dashboard/account/profile";

export type UpdateProfileState = { error?: string; success?: boolean } | undefined;

// 본문 폰트(font_preference)와 사이드바 폰트(sidebar_font_preference)가 같은
// 허용값 목록을 공유한다(2026-09-08, 사이드바 별도 설정 추가; 2026-09-10부터
// lib/fontPreferences.ts를 단일 출처로 참조 — ProfileForm.tsx의 드롭다운·미리보기와
// 항상 같은 목록을 쓰도록).
function parseFontPreference(raw: FormDataEntryValue | null): FontPreferenceId {
  const value = String(raw ?? "");
  return FONT_OPTIONS.some((opt) => opt.id === value) ? (value as FontPreferenceId) : "pretendard";
}

/** profiles에는 의도적으로 authenticated self-update RLS 정책이 없다(같은 행의
 * role을 사용자가 스스로 admin으로 바꿔치기하는 걸 막기 위해 — app/login/actions.ts의
 * recordLogin과 동일한 이유). 그래서 여기서도 세션 클라이언트로 "본인이 맞는지"만
 * 확인한 뒤, admin(service_role) 클라이언트로 title/google_email/phone/font_preference/
 * sidebar_font_preference 다섯 컬럼만 골라서 갱신한다 — role·email·name 등은 이
 * 액션이 절대 건드리지 않는다. */
export async function updateOwnProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const { user } = await requireAuthedClient();

  const title = String(formData.get("title") ?? "").trim() || null;
  const googleEmail = String(formData.get("googleEmail") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const fontPreference = parseFontPreference(formData.get("fontPreference"));
  const sidebarFontPreference = parseFontPreference(formData.get("sidebarFontPreference"));

  if (googleEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(googleEmail)) {
    return { error: "구글 이메일 형식이 올바르지 않습니다." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      title,
      google_email: googleEmail,
      phone,
      font_preference: fontPreference,
      sidebar_font_preference: sidebarFontPreference,
    })
    .eq("id", user.id);

  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return { success: true };
}
