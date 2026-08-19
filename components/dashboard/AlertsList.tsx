import type { DashboardData } from "@/lib/queries/dashboard";

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-semantic-error/15 text-semantic-error border-semantic-error/30",
  warning: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  info: "bg-canvas-cream text-ink-mute border-hairline",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "위험",
  warning: "주의",
  info: "정보",
};

export function AlertsList({ data }: { data: DashboardData["alerts"] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-mute">오늘 발생한 알림이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((alert) => (
        <li
          key={alert.id}
          className={`rounded-md border px-3 py-2 text-sm ${SEVERITY_STYLE[alert.severity]}`}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-medium">
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="text-xs text-ink-mute">{alert.category}</span>
          </div>
          <p className="mt-1">{alert.message}</p>
          {alert.evidenceRef && (
            <p className="mt-1 text-xs text-ink-mute">근거: {alert.evidenceRef}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
