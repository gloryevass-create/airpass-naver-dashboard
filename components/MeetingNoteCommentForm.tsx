"use client";

import { useActionState } from "react";
import { createMeetingNoteComment, type MeetingNoteCommentState } from "@/app/dashboard/actions/meetingNotes";

const initialState: MeetingNoteCommentState = undefined;

export function MeetingNoteCommentForm({ noteId }: { noteId: string }) {
  const action = createMeetingNoteComment.bind(null, noteId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div className="field" style={{ margin: 0 }}>
        <textarea name="content" required rows={2} placeholder="의견을 남겨주세요" className="input" />
      </div>
      {state?.error && <p style={{ fontSize: 13, color: "var(--color-accent-900)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary blueprint" style={{ width: "fit-content" }}>
        {pending ? "등록 중..." : "의견 등록"}
      </button>
    </form>
  );
}
