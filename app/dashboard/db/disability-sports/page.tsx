import { requireAuthedClient } from "@/lib/supabase/authed";
import { getDisabilitySportsFacilities } from "@/lib/queries/disabilitySportsFacilities";
import { DisabilitySportsTable } from "@/components/dashboard/DisabilitySportsTable";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function DisabilitySportsPage() {
  const { supabase } = await requireAuthedClient();
  const facilities = await getDisabilitySportsFacilities(supabase);
  const latestSync = facilities[0]?.syncedAt ?? null;

  return (
    <main className="mx-auto flex w-[90%] flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="tag" className="h-5 w-5" />
          장애인체육시설
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          전국 장애인전용체육시설 현황(공공데이터포털, 대한장애인체육회 공식 API) — 제공되는
          전체 항목을 그대로 담습니다.
          {latestSync && (
            <span className="ml-1 text-ink-mute">
              (최근 동기화: {new Date(latestSync).toLocaleString("ko-KR")})
            </span>
          )}
        </p>
      </div>

      {facilities.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 동기화된 데이터가 없습니다. 파이프라인이 최소 1회 실행되면 여기에 결과가
          표시됩니다.
        </div>
      ) : (
        <DisabilitySportsTable facilities={facilities} />
      )}
    </main>
  );
}
