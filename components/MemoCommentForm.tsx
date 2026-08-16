"use client";

import { useActionState } from "react";
import { createComment, type CreateCommentState } from "@/app/dashboard/memos/actions";

const initialState: CreateCommentState = undefined;

export function MemoCommentForm({ memoId }: { memoId: string }) {
  const action = createComment.bind(null, memoId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea
        name="content"
        required
        rows={3}
        placeholder="의견을 남겨주세요"
        className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-primary px-5 py-1.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "등록 중..." : "댓글 등록"}
      </button>
    </form>
  );
}
