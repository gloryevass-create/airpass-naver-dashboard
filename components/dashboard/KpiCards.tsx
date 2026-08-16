import type { DashboardData } from "@/lib/queries/dashboard";

function formatSpend(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export function KpiCards({ kpi }: { kpi: DashboardData["kpi"] }) {
  const cards = [
    { label: "모니터링 활성 키워드", value: kpi.activeKeywordCount.toLocaleString("ko-KR") },
    { label: "평균 노출순위", value: kpi.avgRank != null ? `${kpi.avgRank}위` : "-" },
    { label: "경쟁사 월 예상 광고비 합계", value: formatSpend(kpi.totalEstSpend) },
    { label: "오늘의 주의·위험 알림", value: kpi.alertCount.toLocaleString("ko-KR") },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
