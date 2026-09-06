import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getAiIssues } from "@/lib/queries/aiIssues";
import { AiHubTabs } from "@/components/dashboard/AiHubTabs";

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default async function AiIssuePage() {
  const { supabase } = await requireAuthedClient();
  const issues = await getAiIssues(supabase);

  const issuesByDate = new Map<string, typeof issues>();
  for (const issue of issues) {
    const list = issuesByDate.get(issue.issueDate) ?? [];
    list.push(issue);
    issuesByDate.set(issue.issueDate, list);
  }

  return (
    <div className="industry-theme" style={{ minHeight: "100vh" }}>
      <AiHubTabs />
      <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>AI Issue</h1>
        </div>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
          매일 아침 AI 업계에서 실제로 이슈가 되는 소식만 AI가 골라 자동으로 채웁니다(키워드 목록이
          아니라 중요도 판단 기반, 하루 최대 10건).
        </p>

        {issues.length === 0 ? (
          <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
            <p className="text-muted" style={{ margin: 0 }}>
              아직 수집된 이슈가 없습니다. 다음 날 아침 자동으로 채워집니다.
            </p>
          </div>
        ) : (
          Array.from(issuesByDate.entries()).map(([date, dateIssues]) => (
            <div key={date} style={{ marginBottom: "var(--space-6)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 var(--space-3)" }}>
                {formatDate(date)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {dateIssues.map((issue) => (
                  <div key={issue.id} className="card blueprint elev-sm" style={{ padding: "var(--space-4) var(--space-5)", background: "#ffffff" }}>
                    <a
                      href={issue.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: "var(--color-accent-700)" }}
                    >
                      {issue.title}
                    </a>
                    {issue.summary && <p style={{ fontSize: 13, margin: "6px 0 0" }}>{issue.summary}</p>}
                    {issue.description && (
                      <p className="text-muted" style={{ fontSize: 12, margin: "4px 0 0" }}>
                        {issue.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
