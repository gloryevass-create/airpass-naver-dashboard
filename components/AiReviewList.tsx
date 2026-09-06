"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AiReviewListItem } from "@/lib/queries/aiReviews";
import { normalizeSearch } from "@/lib/normalizeSearch";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function AiReviewList({ reviews }: { reviews: AiReviewListItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return reviews;
    return reviews.filter(
      (r) => normalizeSearch(r.title).includes(q) || normalizeSearch(r.authorDisplay).includes(q)
    );
  }, [reviews, search]);

  return (
    <>
      <input
        type="search"
        className="input"
        placeholder="제목·작성자로 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "var(--space-4)", maxWidth: 320 }}
      />

      {filtered.length === 0 ? (
        <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <p className="text-muted" style={{ margin: 0 }}>
            {reviews.length === 0 ? "아직 등록된 리뷰가 없습니다." : "검색 결과가 없습니다."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {filtered.map((r) => (
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
    </>
  );
}
