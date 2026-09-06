import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getAiTools } from "@/lib/queries/aiTools";
import { AiToolsBoard } from "@/components/dashboard/AiToolsBoard";

export default async function AiToolsPage() {
  const { supabase, user } = await requireAuthedClient();
  const tools = await getAiTools(supabase);

  return <AiToolsBoard tools={tools} currentUserId={user.id} />;
}
