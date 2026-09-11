"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MeetingNoteListItem } from "@/lib/queries/meetingNotes";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { normalizeSearch } from "@/lib/normalizeSearch";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {filtered.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard/meeting-notes/${n.id}`}
              className="card blueprint elev-sm"
              style={{ display: "block", padding: "var(--space-4) var(--space-5)", background: "#ffffff", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14 }}>{n.title}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {n.authorDisplay}
                  {n.meetingDate && ` · ${formatDate(n.meetingDate)}`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
