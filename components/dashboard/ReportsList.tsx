import type { DashboardData } from "@/lib/queries/dashboard";

const REPORT_TYPE_LABEL: Record<string, string> = {
  daily: "일간",
  weekly: "주간",
  monthly: "월간",
};

const TRACK_LABEL: Record<string, string> = {
  ad: "광고",
  blog: "블로그",
  combined: "통합",
};

export function ReportsList({ data }: { data: DashboardData["reports"] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-mute">아직 생성된 리포트가 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-hairline rounded-sm border border-hairline">
      {data.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{r.title}</p>
            <p className="mt-0.5 text-xs text-ink-mute">
              {r.date} · {REPORT_TYPE_LABEL[r.reportType]} · {TRACK_LABEL[r.track]}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
