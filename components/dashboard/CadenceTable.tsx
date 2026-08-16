import type { DashboardData } from "@/lib/queries/dashboard";

export function CadenceTable({ data }: { data: DashboardData["cadence"] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full whitespace-nowrap text-sm">
        <thead className="bg-canvas-cream text-left text-ink-mute">
          <tr>
            <th className="px-4 py-2 font-medium">블로그</th>
            <th className="px-4 py-2 font-medium">평균 발행 간격</th>
            <th className="px-4 py-2 font-medium">최근 게시일</th>
            <th className="px-4 py-2 font-medium">최근 30일 게시물 수</th>
            <th className="px-4 py-2 font-medium">총 게시물 수</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.competitorId} className="border-t border-hairline">
              <td className="px-4 py-2">{row.competitorName}</td>
              <td className="px-4 py-2">
                {row.avgIntervalDays != null ? `${row.avgIntervalDays}일` : "-"}
              </td>
              <td className="px-4 py-2">{row.lastPostAt ?? "-"}</td>
              <td className="px-4 py-2">{row.postCount30d ?? "-"}</td>
              <td className="px-4 py-2">{row.totalPostCount.toLocaleString("ko-KR")}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-ink-mute">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
