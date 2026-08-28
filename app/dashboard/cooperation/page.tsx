import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getCooperationProjects } from "@/lib/queries/cooperationProjects";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { IndustryCooperationBoard } from "@/components/dashboard/IndustryCooperationBoard";

export default async function CooperationPage() {
  const { supabase } = await requireAuthedClient();
  const [projects, members] = await Promise.all([
    getCooperationProjects(supabase),
    getTeamMemberNames(supabase),
  ]);

  return <IndustryCooperationBoard projects={projects} members={members} />;
}
