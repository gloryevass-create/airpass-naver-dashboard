import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getWorkJournalEntries } from "@/lib/queries/workJournal";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { IndustryWorkJournalBoard } from "@/components/dashboard/IndustryWorkJournalBoard";

export default async function WorkJournalPage() {
  const { supabase, user } = await requireAuthedClient();
  const [entries, members, profile] = await Promise.all([
    getWorkJournalEntries(supabase),
    getTeamMemberNames(supabase),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle().then((r) => r.data),
  ]);

  return <IndustryWorkJournalBoard entries={entries} members={members} currentUserName={profile?.name ?? null} />;
}
