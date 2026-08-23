import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { formatMember } from "@/lib/formatMember";

type Client = SupabaseClient<Database>;

export type MarketingTaskComment = {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
};

export type MarketingTaskHistoryEntry = {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isOwn: boolean;
};

export type MarketingTask = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  workType: string | null;
  stage: string | null;
  status: string;
  dueDate: string | null;
  dueDateEnd: string | null;
  dueDateIsDatetime: boolean;
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  comments: MarketingTaskComment[];
  history: MarketingTaskHistoryEntry[];
};

/** author_id -> "이름(직함)" 표시용 맵(광고전략메모/SI Business/협업과 동일한 패턴). */
async function fetchAuthorDisplayById(supabase: Client): Promise<Map<string, string>> {
  const { data: profiles } = await supabase.from("profiles").select("id, email, name, title");
  const map = new Map<string, string>();
  for (const p of profiles ?? []) {
    map.set(p.id, formatMember(p.name, p.title, p.email));
  }
  return map;
}

// marketing_tasks는 이 대시보드가 직접 쓰는(Notion 연동 없는) 마케팅 업무
// 데이터라 admin 캐싱 없이 요청자의 세션 클라이언트로 매번 최신값을 읽는다
// (product_catalog/business_projects_v2/cooperation_projects와 동일한 패턴).
export async function getMarketingTasks(supabase: Client): Promise<MarketingTask[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: comments }, { data: history }, authorDisplayById] = await Promise.all([
    supabase.from("marketing_tasks").select("*").order("created_at", { ascending: false }),
    supabase
      .from("marketing_tasks_comments")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("marketing_tasks_history")
      .select("*")
      .order("created_at", { ascending: true }),
    fetchAuthorDisplayById(supabase),
  ]);

  const commentsByTask = new Map<string, MarketingTaskComment[]>();
  for (const c of comments ?? []) {
    const list = commentsByTask.get(c.task_id) ?? [];
    list.push({
      id: c.id,
      authorEmail: authorDisplayById.get(c.author_id) ?? c.author_email,
      content: c.content,
      createdAt: c.created_at,
      isOwn: c.author_id === user?.id,
    });
    commentsByTask.set(c.task_id, list);
  }

  const historyByTask = new Map<string, MarketingTaskHistoryEntry[]>();
  for (const h of history ?? []) {
    const list = historyByTask.get(h.task_id) ?? [];
    list.push({
      id: h.id,
      authorEmail: authorDisplayById.get(h.author_id) ?? h.author_email,
      content: h.content,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
      isOwn: h.author_id === user?.id,
    });
    historyByTask.set(h.task_id, list);
  }

  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    content: t.content,
    category: t.category,
    workType: t.work_type,
    stage: t.stage,
    status: t.status,
    dueDate: t.due_date,
    dueDateEnd: t.due_date_end,
    dueDateIsDatetime: t.due_date_is_datetime,
    assignees: t.assignees,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    comments: commentsByTask.get(t.id) ?? [],
    history: historyByTask.get(t.id) ?? [],
  }));
}
