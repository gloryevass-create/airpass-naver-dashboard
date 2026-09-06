import "@/components/industryTheme.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMeetingNoteDetail } from "@/lib/queries/meetingNotes";
import { deleteMeetingNote } from "@/app/dashboard/actions/meetingNotes";
import { DeleteMemoButton } from "@/components/DeleteMemoButton";
import { MarkdownContent, extractHeadings } from "@/components/dashboard/MarkdownContent";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

type Params = Promise<{ id: string }>;

export default async function MeetingNoteDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase, user } = await requireAuthedClient();

  const note = await getMeetingNoteDetail(supabase, id);
  if (!note) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const canModify = note.authorId === user.id || profile?.role === "admin";

  const headings = extractHeadings(note.content);

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1180, margin: "0 auto" }}>
      <Link
        href="/dashboard/meeting-notes"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-accent-700)",
          fontSize: 13,
          textDecoration: "none",
          marginBottom: "var(--space-5)",
        }}
      >
        ← 목록으로
      </Link>

      <div style={{ display: "flex", gap: "var(--space-8)", alignItems: "flex-start" }}>
        <div className="card blueprint elev-sm" style={{ flex: 1, minWidth: 0, padding: "var(--space-6) var(--space-8)", background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: "0 0 var(--space-2)", color: "var(--color-accent-700)" }}>
              {note.title}
            </h1>
            {canModify && (
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Link href={`/dashboard/meeting-notes/${note.id}/edit`} className="btn btn-secondary blueprint">
                  수정
                </Link>
                <DeleteMemoButton action={deleteMeetingNote.bind(null, note.id)} />
              </div>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: 13, margin: "0 0 var(--space-6)" }}>
            {note.authorDisplay}
            {note.meetingDate && ` · 미팅일 ${formatDate(note.meetingDate)}`}
            {` · 등록 ${formatDate(note.createdAt.slice(0, 10))}`}
          </p>

          <MarkdownContent content={note.content} />
        </div>

        {headings.length > 0 && (
          <nav
            style={{
              width: 220,
              flexShrink: 0,
              position: "sticky",
              top: "var(--space-6)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
            }}
          >
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 var(--space-1)" }}>
              목차
            </p>
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                style={{
                  color: "var(--color-accent-700)",
                  textDecoration: "none",
                  paddingLeft: (h.depth - 1) * 10,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {h.text}
              </a>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
