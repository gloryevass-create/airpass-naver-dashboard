import type { DashboardData } from "@/lib/queries/dashboard";

export function KpiCards({ kpi }: { kpi: DashboardData["kpi"] }) {
  const cards = [
    { label: "모니터링 활성 키워드", value: kpi.activeKeywordCount.toLocaleString("ko-KR") },
    { label: "평균 노출순위", value: kpi.avgRank != null ? `${kpi.avgRank}위` : "-" },
    { label: "오늘의 주의·위험 알림", value: kpi.alertCount.toLocaleString("ko-KR") },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-sm border border-hairline p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">{c.label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-primary">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
