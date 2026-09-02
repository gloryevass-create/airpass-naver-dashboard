import { requireAuthedClient } from "@/lib/supabase/authed";
import { getSpecialSchools } from "@/lib/queries/specialSchools";
import { SpecialSchoolTable } from "@/components/dashboard/SpecialSchoolTable";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function SpecialSchoolsPage() {
  await requireAuthedClient();
  const schools = await getSpecialSchools();
  const latestSync = schools[0]?.syncedAt ?? null;

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="tag" className="h-5 w-5" />
          특수학교현황
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          전국 특수학교 현황(공공데이터포털, 교육부 국립특수교육원_특수학교현황).
          {latestSync && (
            <span className="ml-1 text-ink-mute">
              (최근 동기화: {new Date(latestSync).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})
            </span>
          )}
        </p>
      </div>

      {schools.length === 0 ? (
        <div className="rounded-sm border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 동기화된 데이터가 없습니다. 파이프라인이 최소 1회 실행되면 여기에 결과가
          표시됩니다.
        </div>
      ) : (
        <SpecialSchoolTable schools={schools} />
      )}
    </main>
  );
}
