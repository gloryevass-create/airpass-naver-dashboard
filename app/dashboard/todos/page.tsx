import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMyTodos } from "@/lib/queries/todos";
import { TodoBoard } from "@/components/dashboard/TodoBoard";

export default async function TodosPage() {
  const { supabase } = await requireAuthedClient();
  const todos = await getMyTodos(supabase);

  return <TodoBoard todos={todos} />;
}
