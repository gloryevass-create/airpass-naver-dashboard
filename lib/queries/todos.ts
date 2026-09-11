import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type TodoPriority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: TodoPriority;
  isCompleted: boolean;
  completedAt: string | null;
  alarmAt: string | null;
  alarmSent: boolean;
  createdAt: string;
};

// RLS가 owner_id = auth.uid()만 허용하므로 여기서 owner_id로 다시 거르지
// 않는다(다른 개인 소유 기능이 없어 참고할 기존 패턴이 없음 — profiles처럼
// service_role을 거치는 방식이 아니라 세션 클라이언트가 그대로 필터링됨).
export async function getMyTodos(supabase: Client): Promise<Todo[]> {
  const { data } = await supabase
    .from("todos")
    .select("*")
    .order("is_completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.due_date,
    priority: t.priority,
    isCompleted: t.is_completed,
    completedAt: t.completed_at,
    alarmAt: t.alarm_at,
    alarmSent: t.alarm_sent,
    createdAt: t.created_at,
  }));
}
