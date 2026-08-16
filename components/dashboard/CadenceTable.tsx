import type { DashboardData } from "@/lib/queries/dashboard";

export function CadenceTable({ data }: { data: DashboardData["cadence"] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">경쟁사</th>
            <th className="px-4 py-2 font-medium">평균 발행 간격</th>
            <th className="px-4 py-2 font-medium">최근 게시일</th>
            <th className="px-4 py-2 font-medium">최근 30일 게시물 수</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.competitorId} className="border-t border-neutral-100">
              <td className="px-4 py-2">{row.competitorName}</td>
              <td className="px-4 py-2">
                {row.avgIntervalDays != null ? `${row.avgIntervalDays}일` : "-"}
              </td>
              <td className="px-4 py-2">{row.lastPostAt ?? "-"}</td>
              <td className="px-4 py-2">{row.postCount30d ?? "-"}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
