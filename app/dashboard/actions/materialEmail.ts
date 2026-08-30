"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { ensureFileShared, listMaterialFiles } from "@/lib/googleDriveMaterials";
import { sendMaterialEmail as sendMaterialEmailViaResend } from "@/lib/materialEmail";
import { DEFAULT_MATERIAL_EMAIL_SUBJECT, DEFAULT_MATERIAL_EMAIL_MESSAGE } from "@/lib/materialEmailDefaults";
import { matchProductMaterialFiles, type MaterialEmailProductLink } from "@/lib/materialEmailTemplate";
import { getQuotation } from "@/lib/queries/quotations";
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

// 회사 소개자료 폴더에서 PRODUCT_MATERIAL_CATALOG 이름과 일치하는 파일만 실제
// 공유 링크로 바꾼다(사용자 확인, 2026-08-28) — 발송 시점에만 ensureFileShared를
// 호출해 불필요한 구글드라이브 권한 변경 API 호출을 피한다(미리보기에서는 안 함).
async function resolveProductLinks(): Promise<MaterialEmailProductLink[]> {
  const files = await listMaterialFiles();
  const matched = matchProductMaterialFiles(files);
  return Promise.all(
    matched.map(async ({ label, fileId }) => {
      if (!fileId) return { label, link: null };
      const shared = await ensureFileShared(fileId);
      return { label, link: shared.link };
    })
  );
}

/** 요청 헤더에서 이 배포의 절대 origin을 구한다 — 이메일은 브라우저 밖에서
 * 열리므로 상대경로 링크(/dashboard/...)를 쓸 수 없다. */
async function resolveBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://planning-agent.airpass.ai.kr";
}

/** 실제 발송 공통 로직 — 폼 제출(sendMaterialEmailAction)과 AI 자동발송
 * (sendMaterialEmailFromAiDraft) 양쪽이 그대로 재사용한다. */
async function performSend(
  supabase: Awaited<ReturnType<typeof requireAuthedClient>>["supabase"],
  user: Awaited<ReturnType<typeof requireAuthedClient>>["user"],
  params: { recipients: string[]; subject: string; message: string; fileIds: string[]; quotationId: string | null }
): Promise<SendMaterialEmailState> {
  const { recipients, subject, message, fileIds, quotationId } = params;

  if (recipients.length === 0) return { error: "받는 사람 이메일을 입력하세요." };
  const invalid = recipients.find((r) => !EMAIL_RE.test(r));
  if (invalid) return { error: `이메일 주소 형식이 올바르지 않습니다: ${invalid}` };
  if (!subject) return { error: "제목을 입력하세요." };
  if (!message) return { error: "안내 내용을 입력하세요." };
  if (fileIds.length === 0 && !quotationId) return { error: "보낼 자료를 하나 이상 선택하거나 산출내역을 첨부하세요." };

  let files: { name: string; link: string; mimeType: string; iconLink: string | null }[];
  try {
    files = await Promise.all(fileIds.map((id) => ensureFileShared(id)));
  } catch (e) {
    return { error: `자료 공유 링크 생성 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}` };
  }
  const documents = files.filter((f) => !f.mimeType.startsWith("video/"));
  const videos = files.filter((f) => f.mimeType.startsWith("video/"));

  const baseUrl = await resolveBaseUrl();
  const logoUrl = `${baseUrl}/airpass-logo.png`;

  let quotation: { id: string; quoteNumber: string; customerName: string; printUrl: string } | null = null;
  if (quotationId) {
    const q = await getQuotation(supabase, quotationId);
    if (!q) return { error: "선택한 산출내역을 찾을 수 없습니다." };
    // 고객은 로그인이 안 돼 있으므로 /dashboard 안쪽 인쇄 페이지가 아니라
    // 로그인 없이 열리는 공개 페이지(app/quote/[id])로 링크를 보낸다.
    quotation = { id: q.id, quoteNumber: q.quoteNumber, customerName: q.customerName, printUrl: `${baseUrl}/quote/${q.id}` };
  }

  let productLinks: MaterialEmailProductLink[];
  try {
    productLinks = await resolveProductLinks();
  } catch (e) {
    return { error: `제품소개 자료 링크 생성 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}` };
  }

  const { data: profile } = await supabase.from("profiles").select("name, title, email, phone").eq("id", user.id).single();
  const senderName = profile?.name ?? profile?.email ?? user.email ?? "";
  const senderTitle = profile?.title ?? null;
  const senderEmail = profile?.email ?? user.email ?? "";
  const senderPhone = profile?.phone ?? null;

  try {
    await sendMaterialEmailViaResend({
      to: recipients,
      subject,
      message,
      senderName,
      senderTitle,
      senderEmail,
      senderPhone,
      logoUrl,
      documents,
      videos,
      quotation,
      productLinks,
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
    quotation_id: quotation?.id ?? null,
    quotation_quote_number: quotation?.quoteNumber ?? null,
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
  const quotationId = String(formData.get("quotationId") ?? "").trim() || null;

  return performSend(supabase, user, { recipients, subject, message, fileIds, quotationId });
}

/** AI 명령 입력창에서 자료메일발송을 완전 자동으로 처리한다 — 제목·내용을
 * 지정하지 않았으면 기본 안내문을, 보낼 자료를 특정하지 않았으면 전체 자료를
 * 그대로 쓴다(화면에서 쓰는 기본값과 동일, 사용자 확인 2026-08-26). 받는 사람
 * 이메일이 없거나 형식이 잘못됐으면 자동발송하지 않고 에러를 반환한다 —
 * 호출부(AiCommandBar)가 이 경우 자료메일발송 화면으로 안내한다. 산출내역
 * 첨부는 AI 명령으로는 지정할 수 없다(화면에서 직접 골라야 함, 2026-08-28). */
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

  return performSend(supabase, user, { recipients, subject, message, fileIds, quotationId: null });
}
