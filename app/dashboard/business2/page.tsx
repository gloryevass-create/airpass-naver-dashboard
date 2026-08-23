import { requireAuthedClient } from "@/lib/supabase/authed";
import { getBusinessProjectsV2 } from "@/lib/queries/businessProjectsV2";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { BusinessBoardV2 } from "@/components/dashboard/BusinessBoardV2";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function Business2Page() {
  const { supabase } = await requireAuthedClient();
  const [projects, members] = await Promise.all([
    getBusinessProjectsV2(supabase),
    getTeamMemberNames(supabase),
  ]);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="briefcase" className="h-5 w-5" />
          SI Business
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          이 화면에서 직접 사업 항목을 추가·수정·삭제합니다(Notion 연동 없음 — 이 시스템이 원본입니다).
        </p>
      </div>

      <BusinessBoardV2 projects={projects} members={members} />
    </main>
  );
}
