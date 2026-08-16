import type { DashboardData } from "@/lib/queries/dashboard";

function formatClicks(pc: number | null, mobile: number | null) {
  if (pc == null && mobile == null) return "-";
  const total = (pc ?? 0) + (mobile ?? 0);
  return total.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

export function ContentMatchedKeywordTable({
  data,
}: {
  data: DashboardData["contentMatchedKeywords"];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full whitespace-nowrap text-sm">
        <thead className="bg-canvas-cream text-left text-ink-mute">
          <tr>
            <th className="px-4 py-2 font-medium">네이버 키워드</th>
            <th className="px-4 py-2 font-medium">월간조회수</th>
            <th className="px-4 py-2 font-medium">월간클릭수</th>
            <th className="px-4 py-2 font-medium">CPC</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.keywordId} className="border-t border-hairline">
              <td className="px-4 py-2">{row.keyword}</td>
              <td className="px-4 py-2">
                {((row.monthlySearchPc ?? 0) + (row.monthlySearchMobile ?? 0)).toLocaleString(
                  "ko-KR"
                )}
              </td>
              <td className="px-4 py-2">{formatClicks(row.monthlyClickPc, row.monthlyClickMobile)}</td>
              <td className="px-4 py-2">
                {row.avgCpc != null ? `${row.avgCpc.toLocaleString("ko-KR")}원` : "-"}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-ink-mute">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
