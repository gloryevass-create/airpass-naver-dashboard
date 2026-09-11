import "@/components/industryTheme.css";
import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getAiReviews } from "@/lib/queries/aiReviews";
import { AiHubTabs } from "@/components/dashboard/AiHubTabs";
import { AiReviewList } from "@/components/AiReviewList";

export default async function AiReviewListPage() {
  const { supabase } = await requireAuthedClient();
  const reviews = await getAiReviews(supabase);

  return (
    <div className="industry-theme" style={{ background: "#ffffff", minHeight: "100vh" }}>
      <AiHubTabs />
      <div className="board-page-content" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1100, margin: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 6.5L7.9 13a2.5 2.5 0 0 0 3.5 3.5l7-7a4.2 4.2 0 0 0-6-6l-7 7a6 6 0 0 0 8.5 8.5" />
            </svg>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0, color: "var(--color-accent-700)" }}>AI Review</h1>
          </div>
          <Link href="/dashboard/ai-review/new" className="btn btn-primary blueprint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            리뷰 추가
          </Link>
        </div>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
          AI 도구·모델·자료에 대한 리뷰나 학습자료를 마크다운으로 공유합니다.
        </p>

        <AiReviewList reviews={reviews} />
      </div>
    </div>
  );
}
