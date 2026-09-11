import "@/components/industryTheme.css";
import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { MeetingNoteForm } from "@/components/MeetingNoteForm";

export default async function NewMeetingNotePage() {
  await requireAuthedClient();

  return (
    <div className="industry-theme" style={{ minHeight: "100vh", background: "#ffffff" }}>
      <div className="board-page-content" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 800, margin: 0 }}>
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
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: "0 0 var(--space-1)" }}>미팅노트 추가</h1>
      <p style={{ margin: "0 0 var(--space-6)", opacity: 0.6, fontSize: 13 }}>
        lilys.ai에서 &quot;MARKDOWN&quot; 형식으로 내보낸 파일을 올리거나, 내용을 복사해 붙여넣으세요.
      </p>
      <MeetingNoteForm />
      </div>
    </div>
  );
}
