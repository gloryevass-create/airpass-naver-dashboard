"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MeetingNoteListItem } from "@/lib/queries/meetingNotes";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { normalizeSearch } from "@/lib/normalizeSearch";
import { NavIcon } from "@/components/icons/NavIcon";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

// 그룹 기준 날짜 — 회의 날짜(meetingDate)가 없는 노트(예: 참석자 없이 그냥
// 정리만 올린 글)도 월별로 어딘가에는 들어가야 해서 작성일(createdAt)로
// 대체한다.
function groupDate(n: MeetingNoteListItem): string {
  return n.meetingDate ?? n.createdAt;
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return `${y}년 ${m}월`;
}

export function MeetingNoteList({ notes }: { notes: MeetingNoteListItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return notes;
    return notes.filter(
      (n) => normalizeSearch(n.title).includes(q) || normalizeSearch(n.authorDisplay).includes(q)
    );
  }, [notes, search]);

  // 월별 섹션으로 묶는다 — 최신 달이 위로, 같은 달 안에서는 최신 날짜가
  // 위로 오게 정렬(검색 결과에도 동일하게 적용).
  const groups = useMemo(() => {
    const byMonth = new Map<string, MeetingNoteListItem[]>();
    for (const n of filtered) {
      const key = groupDate(n).slice(0, 7);
      const list = byMonth.get(key) ?? [];
      list.push(n);
      byMonth.set(key, list);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, list]) => ({
        monthKey,
        notes: [...list].sort((a, b) => groupDate(b).localeCompare(groupDate(a))),
      }));
  }, [filtered]);

  return (
    <>
      <SearchInput value={search} onChange={setSearch} placeholder="제목·작성자로 검색" />

      {filtered.length === 0 ? (
        <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <p className="text-muted" style={{ margin: 0 }}>
            {notes.length === 0 ? "아직 등록된 미팅노트가 없습니다." : "검색 결과가 없습니다."}
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
                  {g.notes.length}건
                </span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {g.notes.map((n) => (
                  <Link
                    key={n.id}
                    href={`/dashboard/meeting-notes/${n.id}`}
                    className="card blueprint elev-sm"
                    style={{ display: "block", padding: "var(--space-4) var(--space-5)", background: "#ffffff", textDecoration: "none", color: "inherit" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14 }}>
                        <NavIcon name="document" width={14} height={14} stroke="var(--color-accent)" style={{ flexShrink: 0 }} />
                        {n.title}
                      </span>
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        {n.authorDisplay}
                        {n.meetingDate && ` · ${formatDate(n.meetingDate)}`}
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
