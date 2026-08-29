import type { DashboardData } from "@/lib/queries/dashboard";

const SEVERITY_STYLE: Record<string, { background: string; color: string; border: string }> = {
  critical: { background: "color-mix(in srgb, var(--color-accent-900) 8%, transparent)", color: "var(--color-accent-900)", border: "1px solid color-mix(in srgb, var(--color-accent-900) 30%, transparent)" },
  warning: { background: "#fff8ec", color: "#8a5a00", border: "1px solid #f0dfc0" },
  info: { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-divider)" },
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "위험",
  warning: "주의",
  info: "정보",
};

export function AlertsList({ data }: { data: DashboardData["alerts"] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted" style={{ padding: "var(--space-6) 0", textAlign: "center", fontSize: 13 }}>
        오늘 발생한 알림이 없습니다.
      </p>
    );
  }

  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
      {data.map((alert) => {
        const style = SEVERITY_STYLE[alert.severity];
        return (
          <li key={alert.id} style={{ ...style, padding: "var(--space-2) var(--space-3)", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ borderRadius: 999, background: "rgba(0,0,0,0.12)", padding: "1px 8px", fontSize: 11, fontWeight: 500 }}>
                {SEVERITY_LABEL[alert.severity]}
              </span>
              <span className="text-muted" style={{ fontSize: 11 }}>{alert.category}</span>
            </div>
            <p style={{ margin: "4px 0 0" }}>{alert.message}</p>
            {alert.evidenceRef && (
              <p className="text-muted" style={{ margin: "4px 0 0", fontSize: 11 }}>근거: {alert.evidenceRef}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
