import type { DashboardData } from "@/lib/queries/dashboard";

export function KeywordTable({ data }: { data: DashboardData["keywordTable"] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">키워드</th>
            <th className="px-4 py-2 font-medium">노출순위</th>
            <th className="px-4 py-2 font-medium">평균 CPC</th>
            <th className="px-4 py-2 font-medium">월간검색수(PC)</th>
            <th className="px-4 py-2 font-medium">월간검색수(모바일)</th>
            <th className="px-4 py-2 font-medium">경쟁정도</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.keywordId} className="border-t border-neutral-100">
              <td className="px-4 py-2">{row.keyword}</td>
              <td className="px-4 py-2">{row.ourRank ?? "-"}</td>
              <td className="px-4 py-2">
                {row.avgCpc != null ? `${row.avgCpc.toLocaleString("ko-KR")}원` : "-"}
              </td>
              <td className="px-4 py-2">{row.monthlySearchPc?.toLocaleString("ko-KR") ?? "-"}</td>
              <td className="px-4 py-2">
                {row.monthlySearchMobile?.toLocaleString("ko-KR") ?? "-"}
              </td>
              <td className="px-4 py-2">{row.competitionLevel ?? "-"}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
