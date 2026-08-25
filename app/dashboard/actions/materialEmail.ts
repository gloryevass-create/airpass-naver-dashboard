"use server";

import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { formatMember } from "@/lib/formatMember";
import { ensureFileShared, listMaterialFiles } from "@/lib/googleDriveMaterials";
import { sendMaterialEmail as sendMaterialEmailViaResend } from "@/lib/materialEmail";
import { DEFAULT_MATERIAL_EMAIL_SUBJECT, DEFAULT_MATERIAL_EMAIL_MESSAGE } from "@/lib/materialEmailDefaults";
import type { AiMaterialEmailDraft } from "@/lib/aiCommand";

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

/** 실제 발송 공통 로직 — 폼 제출(sendMaterialEmailAction)과 AI 자동발송
 * (sendMaterialEmailFromAiDraft) 양쪽이 그대로 재사용한다. */
async function performSend(
  supabase: Awaited<ReturnType<typeof requireAuthedClient>>["supabase"],
  user: Awaited<ReturnType<typeof requireAuthedClient>>["user"],
  params: { recipients: string[]; subject: string; message: string; fileIds: string[] }
): Promise<SendMaterialEmailState> {
  const { recipients, subject, message, fileIds } = params;

  if (recipients.length === 0) return { error: "받는 사람 이메일을 입력하세요." };
  const invalid = recipients.find((r) => !EMAIL_RE.test(r));
  if (invalid) return { error: `이메일 주소 형식이 올바르지 않습니다: ${invalid}` };
  if (!subject) return { error: "제목을 입력하세요." };
  if (!message) return { error: "안내 내용을 입력하세요." };
  if (fileIds.length === 0) return { error: "보낼 자료를 하나 이상 선택하세요." };

  let files: { name: string; link: string; mimeType: string }[];
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

export async function sendMaterialEmailAction(
  _prevState: SendMaterialEmailState,
  formData: FormData
): Promise<SendMaterialEmailState> {
  const { supabase, user } = await requireAuthedClient();

  const recipients = parseRecipients(String(formData.get("recipients") ?? ""));
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const fileIds = formData.getAll("fileIds").map(String).filter(Boolean);

  return performSend(supabase, user, { recipients, subject, message, fileIds });
}

/** AI 명령 입력창에서 자료메일발송을 완전 자동으로 처리한다 — 제목·내용을
 * 지정하지 않았으면 기본 안내문을, 보낼 자료를 특정하지 않았으면 전체 자료를
 * 그대로 쓴다(화면에서 쓰는 기본값과 동일, 사용자 확인 2026-08-26). 받는 사람
 * 이메일이 없거나 형식이 잘못됐으면 자동발송하지 않고 에러를 반환한다 —
 * 호출부(AiCommandBar)가 이 경우 자료메일발송 화면으로 안내한다. */
export async function sendMaterialEmailFromAiDraft(draft: AiMaterialEmailDraft): Promise<SendMaterialEmailState> {
  const { supabase, user } = await requireAuthedClient();

  const recipients = parseRecipients(draft.recipients);
  const subject = draft.subject.trim() || DEFAULT_MATERIAL_EMAIL_SUBJECT;
  const message = draft.message.trim() || DEFAULT_MATERIAL_EMAIL_MESSAGE;

  let allFiles;
  try {
    allFiles = await listMaterialFiles();
  } catch (e) {
    return { error: `자료 목록 조회 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}` };
  }
  if (allFiles.length === 0) return { error: "자료 폴더에 보낼 파일이 없습니다." };

  const hints = draft.fileNameHints.map((h) => h.toLowerCase().trim()).filter(Boolean);
  const matched = hints.length > 0 ? allFiles.filter((f) => hints.some((h) => f.name.toLowerCase().includes(h))) : [];
  const fileIds = (matched.length > 0 ? matched : allFiles).map((f) => f.id);

  return performSend(supabase, user, { recipients, subject, message, fileIds });
}
