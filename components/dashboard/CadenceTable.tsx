import type { DashboardData } from "@/lib/queries/dashboard";
import { naverBlogUrl } from "@/lib/naverLinks";

export function CadenceTable({ data }: { data: DashboardData["cadence"] }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--color-divider)" }}>
      <table className="table" style={{ whiteSpace: "nowrap" }}>
        <thead>
          <tr>
            <th>블로그</th>
            <th>발행 간격</th>
            <th>최근 게시일</th>
            <th>최근 30일</th>
            <th>총 게시물</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isAirpass = row.competitorName === "에어패스";
            return (
              <tr key={row.competitorId} style={isAirpass ? { boxShadow: "inset 0 0 0 1px var(--color-accent)" } : undefined}>
                <td style={isAirpass ? { fontWeight: 600, color: "var(--color-accent-700)" } : undefined}>
                  {row.blogId ? (
                    <a href={naverBlogUrl(row.blogId)} target="_blank" rel="noopener noreferrer">
                      {row.competitorName}
                    </a>
                  ) : (
                    row.competitorName
                  )}
                </td>
                <td>{row.avgIntervalDays != null ? `${row.avgIntervalDays}일` : "-"}</td>
                <td>{row.lastPostAt ?? "-"}</td>
                <td>{row.postCount30d ?? "-"}</td>
                <td>{row.totalPostCount.toLocaleString("ko-KR")}</td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="text-muted" style={{ textAlign: "center", padding: "var(--space-6)" }}>
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
