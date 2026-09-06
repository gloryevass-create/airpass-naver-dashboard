import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type AiIssue = {
  id: string;
  title: string;
  link: string;
  description: string | null;
  summary: string | null;
  publishedAt: string | null;
  issueDate: string;
};

const DISPLAY_LIMIT = 200;

export async function getAiIssues(supabase: Client): Promise<AiIssue[]> {
  const { data } = await supabase
    .from("ai_issues")
    .select("*")
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(DISPLAY_LIMIT);

  return (data ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    link: i.link,
    description: i.description,
    summary: i.summary,
    publishedAt: i.published_at,
    issueDate: i.issue_date,
  }));
}
