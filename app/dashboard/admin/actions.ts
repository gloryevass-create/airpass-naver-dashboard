"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/supabase/authed";
import { createAdminClient } from "@/lib/supabase/admin";

// 이메일 초대(inviteUserByEmail, 링크 클릭→본인이 비밀번호 설정) 방식에서
// 관리자가 즉시 계정을 만들어주는 등록 방식으로 변경했다(사용자 확인, 2026-08-29).
// 모든 신규 계정의 초기 비밀번호는 이 고정값이고, 로그인 후 헤더 개인 메뉴의
// "비밀번호 변경"에서 각자 바꾸면 된다.
const DEFAULT_PASSWORD = "Airpass1511!";

export type RegisterState = { error?: string; success?: string } | undefined;

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  // 서버에서 다시 한번 관리자 권한을 확인한다 — 클라이언트 UI 숨김만으로는 충분하지 않음.
  await requireAdminClient();

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const googleEmail = String(formData.get("googleEmail") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "올바른 회사메일 주소를 입력하세요." };
  }
  if (!name) {
    return { error: "이름을 입력하세요." };
  }

  const admin = createAdminClient();

  // email_confirm: true — 초대 메일 클릭 없이 관리자가 등록한 즉시 로그인 가능하게 한다.
  // user_metadata의 name/title은 handle_new_user() 트리거가 profiles로 그대로 옮겨 담는다
  // (기존 초대 방식과 동일한 트리거 재사용, 마이그레이션 0019 참고).
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name, title: title || null },
  });

  if (error) {
    return { error: `등록 실패: ${error.message}` };
  }

  if (googleEmail && data.user) {
    await admin.from("profiles").update({ google_email: googleEmail }).eq("id", data.user.id);
  }

  revalidatePath("/dashboard/admin");
  return { success: `${email} 계정을 등록했습니다. 기본 비밀번호: ${DEFAULT_PASSWORD}` };
}
