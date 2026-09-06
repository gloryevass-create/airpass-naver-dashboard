import "@/components/industryTheme.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMeetingNoteDetail } from "@/lib/queries/meetingNotes";
import { MeetingNoteForm } from "@/components/MeetingNoteForm";

type Params = Promise<{ id: string }>;

export default async function EditMeetingNotePage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase, user } = await requireAuthedClient();

  const note = await getMeetingNoteDetail(supabase, id);
  if (!note) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (note.authorId !== user.id && profile?.role !== "admin") notFound();

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 800, margin: "0 auto" }}>
      <Link
        href={`/dashboard/meeting-notes/${note.id}`}
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
        ← 돌아가기
      </Link>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, margin: "0 0 var(--space-6)" }}>미팅노트 수정</h1>
      <MeetingNoteForm note={note} />
    </div>
  );
}
