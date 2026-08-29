import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getWorkJournalEntries } from "@/lib/queries/workJournal";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { IndustryWorkJournalBoard } from "@/components/dashboard/IndustryWorkJournalBoard";

export default async function WorkJournalPage() {
  const { supabase } = await requireAuthedClient();
  const [entries, members] = await Promise.all([
    getWorkJournalEntries(supabase),
    getTeamMemberNames(supabase),
  ]);

  return <IndustryWorkJournalBoard entries={entries} members={members} />;
}
