import { requireAuthedClient } from "@/lib/supabase/authed";
import { getPublicInstitutions } from "@/lib/queries/publicInstitutions";
import { PublicInstitutionTable } from "@/components/dashboard/PublicInstitutionTable";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function PublicInstitutionsPage() {
  await requireAuthedClient();
  const institutions = await getPublicInstitutions();
  const latestSync = institutions[0]?.syncedAt ?? null;

  return (
    <main className="mx-auto flex w-[90%] flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="tag" className="h-5 w-5" />
          공공기관정보
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          전국 공공기관 웹사이트 현황(공공데이터포털, 행정안전부_공공기관 웹,모바일웹
          사이트 정보) — 제공되는 전체 항목을 그대로 담습니다.
          {latestSync && (
            <span className="ml-1 text-ink-mute">
              (최근 동기화: {new Date(latestSync).toLocaleString("ko-KR")})
            </span>
          )}
        </p>
      </div>

      {institutions.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-canvas-cream p-6 text-sm text-ink-mute">
          아직 동기화된 데이터가 없습니다. 파이프라인이 최소 1회 실행되면 여기에 결과가
          표시됩니다.
        </div>
      ) : (
        <PublicInstitutionTable institutions={institutions} />
      )}
    </main>
  );
}
