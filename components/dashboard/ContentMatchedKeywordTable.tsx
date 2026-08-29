import type { DashboardData } from "@/lib/queries/dashboard";
import { naverSearchUrl } from "@/lib/naverLinks";

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
    <div style={{ overflowX: "auto", border: "1px solid var(--color-divider)" }}>
      <table className="table" style={{ whiteSpace: "nowrap" }}>
        <thead>
          <tr>
            <th>네이버 키워드</th>
            <th>월간조회수</th>
            <th>월간클릭수</th>
            <th>CPC</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.keywordId}>
              <td>
                <a href={naverSearchUrl(row.keyword)} target="_blank" rel="noopener noreferrer">
                  {row.keyword}
                </a>
              </td>
              <td>{((row.monthlySearchPc ?? 0) + (row.monthlySearchMobile ?? 0)).toLocaleString("ko-KR")}</td>
              <td>{formatClicks(row.monthlyClickPc, row.monthlyClickMobile)}</td>
              <td>{row.avgCpc != null ? `${row.avgCpc.toLocaleString("ko-KR")}원` : "-"}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="text-muted" style={{ textAlign: "center", padding: "var(--space-6)" }}>
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
