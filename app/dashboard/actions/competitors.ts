"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

export type AddCompetitorState = { error?: string; success?: string } | undefined;

export async function addCompetitor(
  path: string,
  _prevState: AddCompetitorState,
  formData: FormData
): Promise<AddCompetitorState> {
  const { supabase } = await requireAuthedClient();

  const name = String(formData.get("name") ?? "").trim();
  const domain = String(formData.get("domain") ?? "").trim();
  const blogId = String(formData.get("blogId") ?? "").trim();
  if (!name) return { error: "블로그(경쟁사) 이름을 입력하세요." };

  // 삭제는 소프트 삭제(is_active=false)라 이름은 계속 남아있다 — 예전에 삭제했던 이름을
  // 다시 등록하려는 경우 새로 만들지 않고 그 행을 재활성화한다(중복 이름 에러 대신).
  const { data: existing } = await supabase
    .from("competitors")
    .select("id, is_active")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    if (existing.is_active) return { error: "이미 등록된 이름입니다." };
    const { error } = await supabase
      .from("competitors")
      .update({ is_active: true, domain: domain || null, blog_id: blogId || null })
      .eq("id", existing.id);
    if (error) return { error: `재등록 실패: ${error.message}` };
    revalidatePath(path);
    return { success: `"${name}" 재등록 완료 — 다음 자동 수집부터 반영됩니다.` };
  }

  const { error } = await supabase.from("competitors").insert({
    name,
    domain: domain || null,
    blog_id: blogId || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "이미 등록된 이름입니다." };
    return { error: `등록 실패: ${error.message}` };
  }

  revalidatePath(path);
  return { success: `"${name}" 등록 완료 — 다음 자동 수집부터 반영됩니다.` };
}

// formData는 폼 action 시그니처를 맞추기 위해서만 받는다(내용은 쓰지 않음).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteCompetitor(id: string, path: string, formData: FormData): Promise<void> {
  const { supabase } = await requireAuthedClient();
  // 실제 삭제가 아니라 비활성화 — blog_posts/blog_sov_daily/posting_cadence/
  // ad_spend_estimates가 competitor_id를 on delete cascade로 참조하고 있어, 하드 삭제하면
  // 그동안 쌓인 이력이 전부 같이 사라진다. is_active만 꺼서 향후 수집 대상에서만 뺀다.
  await supabase.from("competitors").update({ is_active: false }).eq("id", id);
  revalidatePath(path);
}
