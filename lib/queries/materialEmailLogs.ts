import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type MaterialEmailLog = {
  id: string;
  senderId: string;
  senderEmail: string;
  recipientEmails: string[];
  subject: string;
  message: string;
  fileNames: string[];
  fileLinks: string[];
  quotationId: string | null;
  quotationQuoteNumber: string | null;
  createdAt: string;
};

const LOG_DISPLAY_LIMIT = 30;

export async function getMaterialEmailLogs(supabase: Client): Promise<MaterialEmailLog[]> {
  const { data } = await supabase
    .from("material_email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LOG_DISPLAY_LIMIT);

  return (data ?? []).map((l) => ({
    id: l.id,
    senderId: l.sender_id,
    senderEmail: l.sender_email,
    recipientEmails: l.recipient_emails,
    subject: l.subject,
    message: l.message,
    fileNames: l.file_names,
    fileLinks: l.file_links,
    quotationId: l.quotation_id,
    quotationQuoteNumber: l.quotation_quote_number,
    createdAt: l.created_at,
  }));
}

/** 발송 이력 상세(메일 원문 재구성용) — 목록과 달리 단건이라 LOG_DISPLAY_LIMIT과 무관. */
export async function getMaterialEmailLogById(supabase: Client, id: string): Promise<MaterialEmailLog | null> {
  const { data: l } = await supabase.from("material_email_logs").select("*").eq("id", id).maybeSingle();
  if (!l) return null;
  return {
    id: l.id,
    senderId: l.sender_id,
    senderEmail: l.sender_email,
    recipientEmails: l.recipient_emails,
    subject: l.subject,
    message: l.message,
    fileNames: l.file_names,
    fileLinks: l.file_links,
    quotationId: l.quotation_id,
    quotationQuoteNumber: l.quotation_quote_number,
    createdAt: l.created_at,
  };
}
