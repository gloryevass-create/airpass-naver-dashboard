"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/supabase/authed";
import { createAdminClient } from "@/lib/supabase/admin";

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

export type InviteState = { error?: string; success?: string } | undefined;

export async function inviteUser(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  // 서버에서 다시 한번 관리자 권한을 확인한다 — 클라이언트 UI 숨김만으로는 충분하지 않음.
  await requireAdminClient();

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { error: "올바른 이메일 주소를 입력하세요." };
  }
  if (!name) {
    return { error: "이름을 입력하세요." };
  }

  const origin = await getOrigin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback`,
    data: { name, title: title || null },
  });

  if (error) {
    return { error: `초대 실패: ${error.message}` };
  }

  revalidatePath("/admin");
  return { success: `${email}로 초대 메일을 보냈습니다.` };
}
