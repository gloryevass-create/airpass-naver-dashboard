"use client";

import { useMemo, useState } from "react";
import type { AiIssue } from "@/lib/queries/aiIssues";
import { normalizeSearch } from "@/lib/normalizeSearch";

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function AiIssueList({ issues }: { issues: AiIssue[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return issues;
    return issues.filter(
      (i) =>
        normalizeSearch(i.title).includes(q) ||
        normalizeSearch(i.summary ?? "").includes(q) ||
        normalizeSearch(i.description ?? "").includes(q)
    );
  }, [issues, search]);

  const issuesByDate = useMemo(() => {
    const map = new Map<string, AiIssue[]>();
    for (const issue of filtered) {
      const list = map.get(issue.issueDate) ?? [];
      list.push(issue);
      map.set(issue.issueDate, list);
    }
    return map;
  }, [filtered]);

  return (
    <>
      <input
        type="search"
        className="input"
        placeholder="제목·요약으로 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "var(--space-4)", maxWidth: 320 }}
      />

      {filtered.length === 0 ? (
        <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <p className="text-muted" style={{ margin: 0 }}>
            {issues.length === 0 ? "아직 수집된 이슈가 없습니다. 다음 날 아침 자동으로 채워집니다." : "검색 결과가 없습니다."}
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
    </>
  );
}
