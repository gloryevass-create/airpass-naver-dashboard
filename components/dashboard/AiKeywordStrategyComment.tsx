export function AiKeywordStrategyComment({ comment }: { comment: string | null }) {
  if (!comment) return null;

  return (
    <div className="card" style={{ background: "#ffffff", borderRadius: 8, boxShadow: "var(--shadow-sm)" }}>
      <h2 style={{ margin: "0 0 var(--space-2)", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }} className="text-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.6 4.9L18.5 9l-4.9 1.6L12 15.5l-1.6-4.9L5.5 9l4.9-1.6L12 3z" />
          <path d="M19 15.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9z" />
        </svg>
        AI 키워드 전략 코멘트
      </h2>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{comment}</p>
    </div>
  );
}
