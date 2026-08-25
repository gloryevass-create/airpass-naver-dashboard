"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTeamEventV2 } from "@/app/dashboard/actions/eventsV2";
import { createMemo } from "@/app/dashboard/memos/actions";
import {
  runAiCommand,
  type AiCommandActionResult,
  type AiCommandResult,
  type AiCommandTurn,
} from "@/app/dashboard/actions/aiCommand";
import { MemberMultiSelect } from "@/components/dashboard/MemberMultiSelect";

const MEMO_CATEGORY_OPTIONS = [
  { value: "business", label: "SI Business" },
  { value: "cooperation", label: "Cooperation" },
  { value: "marketing", label: "Marketing" },
  { value: "etc", label: "etc" },
];

const FIELD_CLASS =
  "rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary";

function CalendarEventPreview({
  input,
  members,
  onDone,
}: {
  input: Extract<AiCommandResult, { tool: "create_calendar_event" }>["input"];
  members: string[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTeamEventV2, undefined);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        router.refresh();
        onDone();
      }}
      className="flex flex-col gap-2 rounded-sm border border-primary/30 bg-canvas-cream p-3"
    >
      <p className="text-xs font-semibold text-primary">
        Calendar에 새 일정으로 등록합니다 — 확인 후 저장하세요.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          제목 *
          <input name="title" defaultValue={input.title} required className={FIELD_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          시작일시 *
          <input name="dateStart" type="datetime-local" defaultValue={input.dateStart} required className={FIELD_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          종료일시
          <input name="dateEnd" type="datetime-local" defaultValue={input.dateEnd} className={FIELD_CLASS} />
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-mute sm:col-span-2">
          <input type="checkbox" name="isDatetime" defaultChecked={!input.isAllDay} />
          시간까지 정확함(끄면 날짜만 있는 일정으로 표시)
        </label>
        <input type="hidden" name="tags" value="" />
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          분류
          <input name="category" defaultValue={input.category} className={FIELD_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          장소
          <input name="location" defaultValue={input.location} className={FIELD_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          대상
          <input name="target" defaultValue={input.target} className={FIELD_CLASS} />
        </label>
        <MemberMultiSelect name="assignees" label="담당자" members={members} defaultValue={input.assignees} />
        <MemberMultiSelect name="attendees" label="참석자" members={members} defaultValue={input.attendees} />
      </div>
      <label className="flex flex-col gap-1 text-xs text-ink-mute">
        내용
        <textarea name="content" defaultValue={input.content} rows={2} className={FIELD_CLASS} />
      </label>
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "저장 중..." : "일정 등록"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function MemoPreview({
  input,
  onDone,
}: {
  input: Extract<AiCommandResult, { tool: "create_memo" }>["input"];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(createMemo, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-sm border border-primary/30 bg-canvas-cream p-3">
      <p className="text-xs font-semibold text-primary">
        Memo Board에 새 메모로 등록합니다 — 확인 후 저장하세요.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          구분
          <select name="category" defaultValue={input.category} className={FIELD_CLASS}>
            {MEMO_CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          제목 *
          <input name="title" defaultValue={input.title} required className={FIELD_CLASS} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-ink-mute">
        내용 *
        <textarea name="content" defaultValue={input.content} required rows={3} className={FIELD_CLASS} />
      </label>
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "저장 중..." : "메모 등록"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export function AiCommandBar({ members }: { members: string[] }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<AiCommandTurn[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setMessage("");
    setHistory([]);
    setPendingQuestion(null);
    setDraft(null);
    setError(null);
  }

  function submit() {
    const text = message.trim();
    if (!text || isPending) return;
    setError(null);
    startTransition(async () => {
      const res: AiCommandActionResult = await runAiCommand(text, history);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      if (res.tool === "ask_clarification") {
        setHistory((h) => [...h, { role: "user", text }, { role: "assistant", text: res.question }]);
        setPendingQuestion(res.question);
        setMessage("");
        return;
      }
      setDraft(res);
      setPendingQuestion(null);
      setMessage("");
    });
  }

  if (draft?.tool === "create_calendar_event") {
    return (
      <div className="border-b border-hairline bg-[#fafafa] px-6 py-3">
        <CalendarEventPreview input={draft.input} members={members} onDone={reset} />
      </div>
    );
  }
  if (draft?.tool === "create_memo") {
    return (
      <div className="border-b border-hairline bg-[#fafafa] px-6 py-3">
        <MemoPreview input={draft.input} onDone={reset} />
      </div>
    );
  }

  return (
    <div className="border-b border-hairline bg-[#fafafa] px-6 py-3">
      {pendingQuestion && (
        <p className="mb-1.5 text-xs text-ink-mute">
          <span className="font-semibold text-primary">AI</span> {pendingQuestion}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="shrink-0 text-primary">
          ✦
        </span>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={
            pendingQuestion ? "답변을 입력하세요" : "예: 내일 오후 2시 김민준님이랑 XR스크린 미팅 캘린더에 등록해줘"
          }
          disabled={isPending}
          className="min-w-0 flex-1 rounded-full border border-hairline bg-canvas-cream px-4 py-2 text-sm text-ink outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !message.trim()}
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {isPending ? "처리 중..." : "AI로 처리"}
        </button>
        {(history.length > 0 || error) && (
          <button type="button" onClick={reset} className="shrink-0 text-xs text-ink-mute hover:underline">
            초기화
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-semantic-error">{error}</p>}
    </div>
  );
}
