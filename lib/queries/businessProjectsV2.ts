import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { formatMember } from "@/lib/formatMember";

type Client = SupabaseClient<Database>;

export type BusinessProjectV2Comment = {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
};

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
  comments: BusinessProjectV2Comment[];
};

/** author_id -> "이름(직함)" 표시용 맵(광고전략메모와 동일한 패턴). */
async function fetchAuthorDisplayById(supabase: Client): Promise<Map<string, string>> {
  const { data: profiles } = await supabase.from("profiles").select("id, email, name, title");
  const map = new Map<string, string>();
  for (const p of profiles ?? []) {
    map.set(p.id, formatMember(p.name, p.title, p.email));
  }
  return map;
}

// business_projects_v2는 이 대시보드가 직접 쓰는(Notion 연동 없는) 사업 관리
// 데이터라 admin 캐싱 없이 요청자의 세션 클라이언트로 매번 최신값을 읽는다
// (product_catalog/partner_vendors와 동일한 패턴).
export async function getBusinessProjectsV2(supabase: Client): Promise<BusinessProjectV2[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: comments }, authorDisplayById] = await Promise.all([
    supabase.from("business_projects_v2").select("*").order("created_at", { ascending: false }),
    supabase
      .from("business_projects_v2_comments")
      .select("*")
      .order("created_at", { ascending: true }),
    fetchAuthorDisplayById(supabase),
  ]);

  const commentsByProject = new Map<string, BusinessProjectV2Comment[]>();
  for (const c of comments ?? []) {
    const list = commentsByProject.get(c.project_id) ?? [];
    list.push({
      id: c.id,
      authorEmail: authorDisplayById.get(c.author_id) ?? c.author_email,
      content: c.content,
      createdAt: c.created_at,
      isOwn: c.author_id === user?.id,
    });
    commentsByProject.set(c.project_id, list);
  }

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
    comments: commentsByProject.get(p.id) ?? [],
  }));
}
