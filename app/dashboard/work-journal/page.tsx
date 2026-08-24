import { requireAuthedClient } from "@/lib/supabase/authed";
import { getWorkJournalEntries } from "@/lib/queries/workJournal";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { WorkJournalBoard } from "@/components/dashboard/WorkJournalBoard";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function WorkJournalPage() {
  const { supabase } = await requireAuthedClient();
  const [entries, members] = await Promise.all([
    getWorkJournalEntries(supabase),
    getTeamMemberNames(supabase),
  ]);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="chat" className="h-5 w-5" />
          Work Journal
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          팀원별 주차 업무일지를 관리합니다(Notion 연동 없음 — 이 시스템이 원본입니다).
        </p>
      </div>

      <WorkJournalBoard entries={entries} members={members} />
    </main>
  );
}
