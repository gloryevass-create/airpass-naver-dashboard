import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type CooperationProject = {
  id: string;
  title: string;
  company: string | null;
  relationType: string | null;
  workType: string | null;
  status: string;
  projectStartDate: string | null;
  projectEndDate: string | null;
  projectDateIsDatetime: boolean;
  mainAssignees: string[];
  subAssignees: string[];
  content: string | null;
  aiKeywords: string | null;
  createdAt: string;
  updatedAt: string;
};

// cooperation_projects는 이 대시보드가 직접 쓰는(Notion 연동 없는) 협업 관리
// 데이터라 admin 캐싱 없이 요청자의 세션 클라이언트로 매번 최신값을 읽는다
// (product_catalog/business_projects_v2와 동일한 패턴).
export async function getCooperationProjects(supabase: Client): Promise<CooperationProject[]> {
  const { data } = await supabase
    .from("cooperation_projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    company: p.company,
    relationType: p.relation_type,
    workType: p.work_type,
    status: p.status,
    projectStartDate: p.project_start_date,
    projectEndDate: p.project_end_date,
    projectDateIsDatetime: p.project_date_is_datetime,
    mainAssignees: p.main_assignees,
    subAssignees: p.sub_assignees,
    content: p.content,
    aiKeywords: p.ai_keywords,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}
