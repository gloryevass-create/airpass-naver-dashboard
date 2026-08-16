"use client";

import { useActionState, useState } from "react";
import { updateMemo, type UpdateMemoState } from "@/app/dashboard/memos/actions";
import type { MemoDetail } from "@/lib/queries/memos";

const initialState: UpdateMemoState = undefined;

const CATEGORY_OPTIONS = [
  { value: "keyword", label: "키워드" },
  { value: "blog", label: "블로그" },
  { value: "etc", label: "기타" },
];

export function MemoEditForm({ memo }: { memo: MemoDetail }) {
  const action = updateMemo.bind(null, memo.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  function toggleRemove(id: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-ink">
          구분
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={memo.category}
          className="w-40 rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-ink">
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={memo.title}
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-sm font-medium text-ink">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={10}
          defaultValue={memo.content}
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      {memo.attachments.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink">기존 첨부파일</p>
          <ul className="flex flex-col gap-1">
            {memo.attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="removeAttachments"
                  value={a.id}
                  id={`remove-${a.id}`}
                  checked={removedIds.has(a.id)}
                  onChange={() => toggleRemove(a.id)}
                />
                <label
                  htmlFor={`remove-${a.id}`}
                  className={removedIds.has(a.id) ? "text-ink-mute line-through" : "text-ink"}
                >
                  📎 {a.fileName}
                </label>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-mute">체크한 파일은 저장 시 삭제됩니다.</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="files" className="text-sm font-medium text-ink">
          새 파일첨부
        </label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none file:mr-3 file:rounded file:border-0 file:bg-canvas-cream file:px-3 file:py-1 file:text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
