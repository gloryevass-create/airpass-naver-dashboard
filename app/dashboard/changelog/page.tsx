import { requireAuthedClient } from "@/lib/supabase/authed";
import { CHANGELOG } from "@/lib/changelog";
import { NavIcon } from "@/components/icons/NavIcon";

function formatDateHeading(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  });
}

export default async function ChangelogPage() {
  await requireAuthedClient();

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="history" className="h-5 w-5" />
          업데이트 히스토리
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          이 대시보드가 하루하루 어떤 기능을 개발·변경했는지 기록합니다(수집 데이터 갱신
          이력이 아니라 개발 작업 이력입니다).
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {CHANGELOG.map((entry) => (
          <li key={entry.date} className="rounded-sm border border-hairline bg-canvas-cream p-4">
            <h2 className="mb-2 text-sm font-semibold text-ink">{formatDateHeading(entry.date)}</h2>
            <ul className="flex flex-col gap-1.5">
              {entry.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-mute">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-mute" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {CHANGELOG.length === 0 && (
          <li className="rounded-sm border border-hairline bg-canvas-cream p-6 text-center text-sm text-ink-mute">
            아직 기록된 히스토리가 없습니다.
          </li>
        )}
      </ol>
    </main>
  );
}
