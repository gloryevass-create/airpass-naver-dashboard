import "@/components/industryTheme.css";
import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getAiReviews } from "@/lib/queries/aiReviews";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default async function AiReviewListPage() {
  const { supabase } = await requireAuthedClient();
  const reviews = await getAiReviews(supabase);

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 6.5L7.9 13a2.5 2.5 0 0 0 3.5 3.5l7-7a4.2 4.2 0 0 0-6-6l-7 7a6 6 0 0 0 8.5 8.5" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>AI Review</h1>
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

      {reviews.length === 0 ? (
        <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <p className="text-muted" style={{ margin: 0 }}>
            아직 등록된 리뷰가 없습니다.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {reviews.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/ai-review/${r.id}`}
              className="card blueprint elev-sm"
              style={{ display: "block", padding: "var(--space-4) var(--space-5)", background: "#ffffff", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>{r.title}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {r.authorDisplay} · {formatDate(r.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
