import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { formatMember } from "@/lib/formatMember";

type Client = SupabaseClient<Database>;

export type CooperationProjectComment = {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
};

export type CooperationProjectHistoryEntry = {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isOwn: boolean;
};

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
  comments: CooperationProjectComment[];
  history: CooperationProjectHistoryEntry[];
};

/** author_id -> "이름(직함)" 표시용 맵(광고전략메모/SI Business와 동일한 패턴). */
async function fetchAuthorDisplayById(supabase: Client): Promise<Map<string, string>> {
  const { data: profiles } = await supabase.from("profiles").select("id, email, name, title");
  const map = new Map<string, string>();
  for (const p of profiles ?? []) {
    map.set(p.id, formatMember(p.name, p.title, p.email));
  }
  return map;
}

// cooperation_projects는 이 대시보드가 직접 쓰는(Notion 연동 없는) 협업 관리
// 데이터라 admin 캐싱 없이 요청자의 세션 클라이언트로 매번 최신값을 읽는다
// (product_catalog/business_projects_v2와 동일한 패턴).
export async function getCooperationProjects(supabase: Client): Promise<CooperationProject[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: comments }, { data: history }, authorDisplayById] = await Promise.all([
    // 수정(관계 이동 포함)한 항목이 칸반 보드 맨 위로 오도록 생성일이 아니라
    // 최근 수정일 기준 최신순으로 정렬한다(SI Business와 동일, 사용자 확인 2026-08-23).
    supabase.from("cooperation_projects").select("*").order("updated_at", { ascending: false }),
    supabase
      .from("cooperation_projects_comments")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("cooperation_projects_history")
      .select("*")
      .order("created_at", { ascending: true }),
    fetchAuthorDisplayById(supabase),
  ]);

  const commentsByProject = new Map<string, CooperationProjectComment[]>();
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

  const historyByProject = new Map<string, CooperationProjectHistoryEntry[]>();
  for (const h of history ?? []) {
    const list = historyByProject.get(h.project_id) ?? [];
    list.push({
      id: h.id,
      authorEmail: authorDisplayById.get(h.author_id) ?? h.author_email,
      content: h.content,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
      isOwn: h.author_id === user?.id,
    });
    historyByProject.set(h.project_id, list);
  }

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
    comments: commentsByProject.get(p.id) ?? [],
    history: historyByProject.get(p.id) ?? [],
  }));
}
