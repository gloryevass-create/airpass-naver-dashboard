import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type BusinessProjectV2 = {
  id: string;
  title: string;
  stage: string | null;
  status: string;
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
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// business_projects_v2는 이 대시보드가 직접 쓰는(Notion 연동 없는) 사업 관리
// 데이터라 admin 캐싱 없이 요청자의 세션 클라이언트로 매번 최신값을 읽는다
// (product_catalog/partner_vendors와 동일한 패턴).
export async function getBusinessProjectsV2(supabase: Client): Promise<BusinessProjectV2[]> {
  const { data } = await supabase
    .from("business_projects_v2")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    stage: p.stage,
    status: p.status,
    orgName: p.org_name,
    participationType: p.participation_type,
    workType: p.work_type,
    result: p.result,
    amount: p.amount != null ? Number(p.amount) : null,
    progressRate: p.progress_rate != null ? Number(p.progress_rate) : null,
    submissionDate: p.submission_date,
    submissionDateIsDatetime: p.submission_date_is_datetime,
    submissionMethod: p.submission_method,
    presentationDate: p.presentation_date,
    presentationDateIsDatetime: p.presentation_date_is_datetime,
    constructionStart: p.construction_start,
    constructionEnd: p.construction_end,
    constructionContent: p.construction_content,
    assignees: p.assignees,
    notes: p.notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}
