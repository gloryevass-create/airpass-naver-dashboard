import type { DashboardData } from "@/lib/queries/dashboard";

export function KpiCards({ kpi }: { kpi: DashboardData["kpi"] }) {
  const cards = [
    { label: "모니터링 활성 키워드", value: kpi.activeKeywordCount.toLocaleString("ko-KR") },
    { label: "평균 노출순위", value: kpi.avgRank != null ? `${kpi.avgRank}위` : "-" },
    { label: "오늘의 주의·위험 알림", value: kpi.alertCount.toLocaleString("ko-KR") },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)" }}>
      {cards.map((c) => (
        <div key={c.label} className="card" style={{ background: "#ffffff", borderRadius: 8, boxShadow: "var(--shadow-sm)" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }} className="text-muted">
            {c.label}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
