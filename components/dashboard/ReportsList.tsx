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
    return (
      <p className="text-muted" style={{ padding: "var(--space-6) 0", textAlign: "center", fontSize: 13 }}>
        아직 생성된 리포트가 없습니다.
      </p>
    );
  }

  return (
    <ul style={{ display: "flex", flexDirection: "column", margin: 0, padding: 0, listStyle: "none", border: "1px solid var(--color-divider)" }}>
      {data.map((r) => (
        <li key={r.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "var(--space-3) var(--space-4)", fontSize: 13 }}>
          <p style={{ margin: 0, fontWeight: 500 }}>{r.title}</p>
          <p className="text-muted" style={{ margin: "2px 0 0", fontSize: 11 }}>
            {r.date} · {REPORT_TYPE_LABEL[r.reportType]} · {TRACK_LABEL[r.track]}
          </p>
        </li>
      ))}
    </ul>
  );
}
