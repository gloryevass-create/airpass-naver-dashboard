import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type MaterialEmailLog = {
  id: string;
  senderEmail: string;
  recipientEmails: string[];
  subject: string;
  message: string;
  fileNames: string[];
  fileLinks: string[];
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
    senderEmail: l.sender_email,
    recipientEmails: l.recipient_emails,
    subject: l.subject,
    message: l.message,
    fileNames: l.file_names,
    fileLinks: l.file_links,
    createdAt: l.created_at,
  }));
}
