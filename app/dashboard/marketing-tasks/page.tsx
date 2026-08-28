import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMarketingTasks } from "@/lib/queries/marketingTasks";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { IndustryMarketingBoard } from "@/components/dashboard/IndustryMarketingBoard";

export default async function MarketingTasksPage() {
  const { supabase } = await requireAuthedClient();
  const [tasks, members] = await Promise.all([getMarketingTasks(supabase), getTeamMemberNames(supabase)]);

  return <IndustryMarketingBoard tasks={tasks} members={members} />;
}
