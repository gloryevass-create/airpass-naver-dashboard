import { requireAuthedClient } from "@/lib/supabase/authed";
import { getSeniorWelfareFacilities } from "@/lib/queries/seniorWelfareFacilities";
import { SeniorWelfareFacilityTable } from "@/components/dashboard/SeniorWelfareFacilityTable";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function SeniorWelfareFacilitiesPage() {
  await requireAuthedClient();
  const facilities = await getSeniorWelfareFacilities();
  const latestSync = facilities[0]?.syncedAt ?? null;

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="tag" className="h-5 w-5" />
          전국경로당현황
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          공공데이터포털 전국마을회관및경로당표준데이터 중 시설유형
          &ldquo;경로당&rdquo;만 — 제공되는 전체 항목을 그대로 담습니다.
          {latestSync && (
            <span className="ml-1 text-ink-mute">
              (최근 동기화: {new Date(latestSync).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})
            </span>
          )}
        </p>
      </div>

      {facilities.length === 0 ? (
        <div className="rounded-sm border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 동기화된 데이터가 없습니다. 파이프라인이 최소 1회 실행되면 여기에 결과가
          표시됩니다.
        </div>
      ) : (
        <SeniorWelfareFacilityTable facilities={facilities} />
      )}
    </main>
  );
}
