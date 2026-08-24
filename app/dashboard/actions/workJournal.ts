"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAuthedClient } from "@/lib/supabase/authed";

const PATH = "/dashboard/work-journal";
const BUCKET = "journal-attachments";

// 첨부파일 업로드 제약은 Memo Board와 동일(이미지/PDF/Office 문서/ZIP, 12MB, 최대 5개) —
// 첨부 제약 정책을 앱 전체에서 통일한다(사용자 확인, 2026-08-23 Memo Board 논의 참고).
const ATTACHMENT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
];
const ATTACHMENT_MAX_SIZE = 12 * 1024 * 1024;
const ATTACHMENT_MAX_COUNT = 5;

function validateFiles(files: File[]): string | null {
  if (files.length > ATTACHMENT_MAX_COUNT) {
    return `첨부파일은 한 번에 최대 ${ATTACHMENT_MAX_COUNT}개까지 올릴 수 있습니다.`;
  }
  for (const file of files) {
    if (!ATTACHMENT_ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: 이미지·PDF·Office 문서·ZIP 파일만 올릴 수 있습니다.`;
    }
    if (file.size > ATTACHMENT_MAX_SIZE) {
      return `${file.name}: 파일은 12MB 이하만 올릴 수 있습니다.`;
    }
  }
  return null;
}

export type WorkJournalFormState = { error?: string } | undefined;

function fieldsFromForm(formData: FormData) {
  return {
    author_name: String(formData.get("authorName") ?? "").trim(),
    week_label: String(formData.get("weekLabel") ?? "").trim() || null,
    entry_date: String(formData.get("entryDate") ?? "").trim() || null,
    content: String(formData.get("content") ?? "").trim(),
  };
}

export async function createWorkJournalEntry(
  _prevState: WorkJournalFormState,
  formData: FormData
): Promise<WorkJournalFormState> {
  const { supabase } = await requireAuthedClient();

  const fields = fieldsFromForm(formData);
  if (!fields.author_name) return { error: "작성자를 선택하세요." };
  if (!fields.content) return { error: "내용을 입력하세요." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const fileError = validateFiles(files);
  if (fileError) return { error: fileError };

  const { data: entry, error } = await supabase
    .from("work_journal_entries")
    .insert(fields)
    .select("id")
    .single();
  if (error || !entry) return { error: `저장 실패: ${error?.message ?? "알 수 없는 오류"}` };

  for (const file of files) {
    const path = `${entry.id}/${randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) continue;
    await supabase.from("work_journal_attachments").insert({
      entry_id: entry.id,
      file_name: file.name,
      content_type: file.type,
      storage_path: path,
    });
  }

  revalidatePath(PATH);
  return undefined;
}

export async function updateWorkJournalEntry(
  id: string,
  _prevState: WorkJournalFormState,
  formData: FormData
): Promise<WorkJournalFormState> {
  const { supabase } = await requireAuthedClient();

  const fields = fieldsFromForm(formData);
  if (!fields.author_name) return { error: "작성자를 선택하세요." };
  if (!fields.content) return { error: "내용을 입력하세요." };

  const { error } = await supabase
    .from("work_journal_entries")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: `저장 실패: ${error.message}` };

  revalidatePath(PATH);
  return undefined;
}

export async function deleteWorkJournalEntry(id: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  const { data: attachments } = await supabase
    .from("work_journal_attachments")
    .select("storage_path")
    .eq("entry_id", id);
  if (attachments?.length) {
    await supabase.storage.from(BUCKET).remove(attachments.map((a) => a.storage_path));
  }
  await supabase.from("work_journal_entries").delete().eq("id", id);
  revalidatePath(PATH);
}

export async function deleteWorkJournalAttachment(attachmentId: string): Promise<void> {
  const { supabase } = await requireAuthedClient();
  const { data: attachment } = await supabase
    .from("work_journal_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .maybeSingle();
  if (attachment) {
    await supabase.storage.from(BUCKET).remove([attachment.storage_path]);
    await supabase.from("work_journal_attachments").delete().eq("id", attachmentId);
  }
  revalidatePath(PATH);
}

/** 목록 단계에서는 signed URL을 만들지 않고(수백 건 한번에 서명하면 느려짐), 항목을
 * 펼칠 때만 그 항목의 첨부파일에 대해 필요한 만큼 signed URL을 만든다. */
export async function getWorkJournalAttachmentUrls(
  paths: string[]
): Promise<Record<string, string>> {
  const { supabase } = await requireAuthedClient();
  const result: Record<string, string> = {};
  await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) result[path] = data.signedUrl;
    })
  );
  return result;
}
