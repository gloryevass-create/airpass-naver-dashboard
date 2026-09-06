import "@/components/industryTheme.css";
import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMeetingNotes } from "@/lib/queries/meetingNotes";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default async function MeetingNotesPage() {
  const { supabase } = await requireAuthedClient();
  const notes = await getMeetingNotes(supabase);

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M9 12h6" />
            <path d="M9 16h6" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>Meeting Notes</h1>
        </div>
        <Link href="/dashboard/meeting-notes/new" className="btn btn-primary blueprint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          미팅노트 추가
        </Link>
      </div>
      <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
        lilys.ai에서 내보낸 회의록(마크다운)을 팀 전체가 함께 봅니다.
      </p>

      {notes.length === 0 ? (
        <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <p className="text-muted" style={{ margin: 0 }}>
            아직 등록된 미팅노트가 없습니다.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {notes.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard/meeting-notes/${n.id}`}
              className="card blueprint elev-sm"
              style={{ display: "block", padding: "var(--space-4) var(--space-5)", background: "#ffffff", textDecoration: "none", color: "inherit" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>{n.title}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {n.authorDisplay}
                  {n.meetingDate && ` · ${formatDate(n.meetingDate)}`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
