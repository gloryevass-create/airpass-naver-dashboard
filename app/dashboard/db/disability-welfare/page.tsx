import { requireAuthedClient } from "@/lib/supabase/authed";
import { getDisabilityWelfareCenters } from "@/lib/queries/disabilityWelfareCenters";
import { DisabilityWelfareTable } from "@/components/dashboard/DisabilityWelfareTable";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function DisabilityWelfarePage() {
  const { supabase } = await requireAuthedClient();
  const centers = await getDisabilityWelfareCenters(supabase);
  const latestSync = centers[0]?.syncedAt ?? null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="tag" className="h-5 w-5" />
          장애인편의시설
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          장애인복지관류 공공시설 현황(공공데이터포털, 전국장애인편의시설표준데이터) —
          원본은 전국 18만 건(편의시설이 설치된 건물 전체)이라, 시설명에 &ldquo;장애인&rdquo;과
          &ldquo;복지관&rdquo;이 모두 포함된 공공시설만 추려서 담았습니다.
          {latestSync && (
            <span className="ml-1 text-ink-mute">
              (최근 동기화: {new Date(latestSync).toLocaleString("ko-KR")})
            </span>
          )}
        </p>
      </div>

      {centers.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 동기화된 데이터가 없습니다. 파이프라인이 최소 1회 실행되면 여기에 결과가
          표시됩니다.
        </div>
      ) : (
        <DisabilityWelfareTable centers={centers} />
      )}
    </main>
  );
}
