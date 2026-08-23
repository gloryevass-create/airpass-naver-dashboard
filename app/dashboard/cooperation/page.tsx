import { requireAuthedClient } from "@/lib/supabase/authed";
import { getCooperationProjects } from "@/lib/queries/cooperationProjects";
import { CooperationBoard } from "@/components/dashboard/CooperationBoard";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function CooperationPage() {
  const { supabase } = await requireAuthedClient();
  const projects = await getCooperationProjects(supabase);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="share" className="h-5 w-5" />
          Cooperation
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          이 화면에서 직접 협업 항목을 추가·수정·삭제합니다(Notion 연동 없음 — 이 시스템이 원본입니다).
        </p>
      </div>

      <CooperationBoard projects={projects} />
    </main>
  );
}
