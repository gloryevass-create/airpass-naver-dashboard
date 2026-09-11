import "@/components/industryTheme.css";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getAiIssues } from "@/lib/queries/aiIssues";
import { AiHubTabs } from "@/components/dashboard/AiHubTabs";
import { AiIssueList } from "@/components/AiIssueList";

export default async function AiIssuePage() {
  const { supabase } = await requireAuthedClient();
  const issues = await getAiIssues(supabase);

  return (
    <div className="industry-theme" style={{ background: "#ffffff", minHeight: "100vh" }}>
      <AiHubTabs />
      <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 900, margin: 0 }}>
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

        <AiIssueList issues={issues} />
      </div>
    </div>
  );
}
