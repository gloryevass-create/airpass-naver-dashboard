import { requireAuthedClient } from "@/lib/supabase/authed";
import { getBusinessProjects } from "@/lib/queries/businessProjects";
import { BusinessBoard } from "@/components/dashboard/BusinessBoard";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function BusinessPage() {
  await requireAuthedClient();
  const projects = await getBusinessProjects();
  const latestSync = projects[0]?.syncedAt ?? null;

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="briefcase" className="h-5 w-5" />
          비즈니스
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          Airpass전략기획 팀 노션의 &ldquo;사업진행 현황&rdquo; 데이터베이스를 그대로 미러링합니다.
          원본은 계속 Notion이며, 여기서는 조회만 가능합니다.
          {latestSync && (
            <span className="ml-1 text-ink-mute">
              (최근 동기화: {new Date(latestSync).toLocaleString("ko-KR")})
            </span>
          )}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 동기화된 데이터가 없습니다. 파이프라인이 최소 1회 실행되면 여기에 결과가
          표시됩니다.
        </div>
      ) : (
        <BusinessBoard projects={projects} />
      )}
    </main>
  );
}
