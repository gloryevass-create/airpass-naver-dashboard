"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { formatMember } from "@/lib/formatMember";
import { ensureFileShared } from "@/lib/googleDriveMaterials";
import { sendMaterialEmail as sendMaterialEmailViaResend } from "@/lib/materialEmail";

const PATH = "/dashboard/material-email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SendMaterialEmailState = { error?: string; success?: boolean } | undefined;

function parseRecipients(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

export async function sendMaterialEmailAction(
  _prevState: SendMaterialEmailState,
  formData: FormData
): Promise<SendMaterialEmailState> {
  const { supabase, user } = await requireAuthedClient();

  const recipients = parseRecipients(String(formData.get("recipients") ?? ""));
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const fileIds = formData.getAll("fileIds").map(String).filter(Boolean);

  if (recipients.length === 0) return { error: "받는 사람 이메일을 입력하세요." };
  const invalid = recipients.find((r) => !EMAIL_RE.test(r));
  if (invalid) return { error: `이메일 주소 형식이 올바르지 않습니다: ${invalid}` };
  if (!subject) return { error: "제목을 입력하세요." };
  if (!message) return { error: "안내 내용을 입력하세요." };
  if (fileIds.length === 0) return { error: "보낼 자료를 하나 이상 선택하세요." };

  let files: { name: string; link: string }[];
  try {
    files = await Promise.all(fileIds.map((id) => ensureFileShared(id)));
  } catch (e) {
    return { error: `자료 공유 링크 생성 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}` };
  }

  const { data: profile } = await supabase.from("profiles").select("name, title, email").eq("id", user.id).single();
  const senderName = formatMember(profile?.name ?? null, profile?.title ?? null, profile?.email ?? user.email ?? "");

  try {
    await sendMaterialEmailViaResend({
      to: recipients,
      subject,
      message,
      senderName,
      files,
    });
  } catch (e) {
    return { error: `메일 발송 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}` };
  }

  await supabase.from("material_email_logs").insert({
    sender_id: user.id,
    sender_email: user.email ?? "",
    recipient_emails: recipients,
    subject,
    message,
    file_names: files.map((f) => f.name),
    file_links: files.map((f) => f.link),
  });

  revalidatePath(PATH);
  return { success: true };
}
