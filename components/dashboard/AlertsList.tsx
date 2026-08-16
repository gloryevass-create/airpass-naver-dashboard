import type { DashboardData } from "@/lib/queries/dashboard";

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-neutral-50 text-neutral-600 border-neutral-200",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "위험",
  warning: "주의",
  info: "정보",
};

export function AlertsList({ data }: { data: DashboardData["alerts"] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">오늘 발생한 알림이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((alert) => (
        <li
          key={alert.id}
          className={`rounded-md border px-3 py-2 text-sm ${SEVERITY_STYLE[alert.severity]}`}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium">
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="text-xs text-neutral-500">{alert.category}</span>
          </div>
          <p className="mt-1">{alert.message}</p>
          {alert.evidenceRef && (
            <p className="mt-1 text-xs text-neutral-400">근거: {alert.evidenceRef}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
