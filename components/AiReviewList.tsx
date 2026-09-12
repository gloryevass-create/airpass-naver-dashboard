"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AiReviewListItem } from "@/lib/queries/aiReviews";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { normalizeSearch } from "@/lib/normalizeSearch";
import { NavIcon } from "@/components/icons/NavIcon";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${y}년 ${m}월`;
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

  // 미팅노트 목록과 동일하게 월별 섹션으로 묶는다 — 최신 달이 위로, 같은
  // 달 안에서는 최신 등록순(사용자 확인, 2026-09-13).
  const groups = useMemo(() => {
    const byMonth = new Map<string, AiReviewListItem[]>();
    for (const r of filtered) {
      const key = r.createdAt.slice(0, 7);
      const list = byMonth.get(key) ?? [];
      list.push(r);
      byMonth.set(key, list);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, list]) => ({
        monthKey,
        reviews: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }));
  }, [filtered]);

  return (
    <>
      <SearchInput value={search} onChange={setSearch} placeholder="제목·작성자로 검색" />

      {filtered.length === 0 ? (
        <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <p className="text-muted" style={{ margin: 0 }}>
            {reviews.length === 0 ? "아직 등록된 리뷰가 없습니다." : "검색 결과가 없습니다."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {groups.map((g) => (
            <div key={g.monthKey}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 15,
                  margin: "0 0 var(--space-3)",
                  paddingBottom: "var(--space-2)",
                  borderBottom: "1px solid var(--color-divider)",
                  color: "var(--color-accent-700)",
                }}
              >
                {monthLabel(g.monthKey)}
                <span className="text-muted" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                  {g.reviews.length}건
                </span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {g.reviews.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/ai-review/${r.id}`}
                    className="card blueprint elev-sm"
                    style={{ display: "block", padding: "var(--space-4) var(--space-5)", background: "#ffffff", textDecoration: "none", color: "inherit" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14 }}>
                        <NavIcon name="document" width={14} height={14} stroke="var(--color-accent)" style={{ flexShrink: 0 }} />
                        {r.title}
                      </span>
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        {r.authorDisplay} · {formatDate(r.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
