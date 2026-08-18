import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type BusinessProject = {
  id: string;
  title: string;
  stage: string | null;
  status: string | null;
  orgName: string | null;
  participationType: string | null;
  workType: string | null;
  result: string | null;
  amount: number | null;
  progressRate: number | null;
  submissionDate: string | null;
  submissionDateIsDatetime: boolean;
  submissionMethod: string | null;
  presentationDate: string | null;
  presentationDateIsDatetime: boolean;
  constructionStart: string | null;
  constructionEnd: string | null;
  constructionContent: string | null;
  assignees: string[];
  notionUrl: string;
  syncedAt: string;
};

export async function getBusinessProjects(supabase: Client): Promise<BusinessProject[]> {
  const { data } = await supabase
    .from("business_projects")
    .select("*")
    .order("notion_created_at", { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    stage: p.stage,
    status: p.status,
    orgName: p.org_name,
    participationType: p.participation_type,
    workType: p.work_type,
    result: p.result,
    amount: p.amount,
    progressRate: p.progress_rate,
    submissionDate: p.submission_date,
    submissionDateIsDatetime: p.submission_date_is_datetime,
    submissionMethod: p.submission_method,
    presentationDate: p.presentation_date,
    presentationDateIsDatetime: p.presentation_date_is_datetime,
    constructionStart: p.construction_start,
    constructionEnd: p.construction_end,
    constructionContent: p.construction_content,
    assignees: p.assignees,
    notionUrl: p.notion_url,
    syncedAt: p.synced_at,
  }));
}
