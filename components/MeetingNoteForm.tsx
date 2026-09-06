"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createMeetingNote,
  updateMeetingNote,
  type MeetingNoteFormState,
} from "@/app/dashboard/actions/meetingNotes";
import type { MeetingNoteDetail } from "@/lib/queries/meetingNotes";

const initialState: MeetingNoteFormState = undefined;

export function MeetingNoteForm({ note }: { note?: MeetingNoteDetail }) {
  const action = note ? updateMeetingNote.bind(null, note.id) : createMeetingNote;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const cancelHref = note ? `/dashboard/meeting-notes/${note.id}` : "/dashboard/meeting-notes";

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "flex", gap: "var(--space-4)" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="title">제목</label>
          <input
            id="title"
            name="title"
            type="text"
            maxLength={200}
            placeholder="비워두면 내용 첫 줄의 '# 제목'을 자동으로 씁니다"
            defaultValue={note?.title ?? ""}
            className="input"
          />
        </div>
        <div className="field">
          <label htmlFor="meetingDate">미팅 날짜</label>
          <input
            id="meetingDate"
            name="meetingDate"
            type="date"
            defaultValue={note?.meetingDate ?? ""}
            className="input"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-4)" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="attendees">미팅 참석자</label>
          <input
            id="attendees"
            name="attendees"
            type="text"
            maxLength={500}
            placeholder="예: 정윤강, 곽태순, 위보연"
            defaultValue={note?.attendees ?? ""}
            className="input"
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="location">미팅 장소</label>
          <input
            id="location"
            name="location"
            type="text"
            maxLength={200}
            placeholder="예: 본사 회의실 / 온라인(Zoom)"
            defaultValue={note?.location ?? ""}
            className="input"
          />
        </div>
      </div>

      <div className="field">
        <label>내용</label>
        <div className="seg" style={{ marginBottom: "var(--space-2)", width: "fit-content" }}>
          <button
            type="button"
            className={`seg-opt${mode === "file" ? " active" : ""}`}
            style={{ border: 0 }}
            onClick={() => setMode("file")}
          >
            파일 업로드
          </button>
          <button
            type="button"
            className={`seg-opt${mode === "paste" ? " active" : ""}`}
            style={{ border: 0 }}
            onClick={() => setMode("paste")}
          >
            직접 붙여넣기
          </button>
        </div>

        {/* 두 입력 모두 항상 DOM에 남겨두고 보이기만 전환한다(display:none) — file
            모드에서 파일을 새로 안 고르면, 아래 숨겨진 textarea의 기존 content
            값이 그대로 제출돼 수정 시 "기존 내용 유지"가 자연스럽게 동작한다. */}
        <div style={{ display: mode === "file" ? "block" : "none" }}>
          <input id="file" name="file" type="file" accept=".md,text/markdown,text/plain" className="input" />
          <p className="text-muted" style={{ fontSize: 12, margin: "var(--space-1) 0 0" }}>
            lilys.ai에서 &quot;MARKDOWN&quot; 형식으로 내보낸 .md 파일을 올리세요.
            {note && " 새 파일을 올리지 않으면 기존 내용이 그대로 유지됩니다."}
          </p>
        </div>
        <textarea
          name="content"
          rows={14}
          placeholder="lilys.ai에서 복사한 마크다운 내용을 붙여넣으세요"
          defaultValue={note?.content ?? ""}
          className="input"
          style={{ fontFamily: "monospace", fontSize: 13, display: mode === "paste" ? "block" : "none" }}
        />
      </div>

      {state?.error && <p style={{ fontSize: 13, color: "var(--color-accent-900)" }}>{state.error}</p>}

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button type="submit" disabled={pending} className="btn btn-primary blueprint">
          {pending ? "저장 중..." : note ? "수정 저장" : "등록"}
        </button>
        <Link href={cancelHref} className="btn btn-ghost">
          취소
        </Link>
      </div>
    </form>
  );
}
