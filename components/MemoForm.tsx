"use client";

import { useActionState } from "react";
import { createMemo, type CreateMemoState } from "@/app/dashboard/memos/actions";

const initialState: CreateMemoState = undefined;

const CATEGORY_OPTIONS = [
  { value: "keyword", label: "키워드" },
  { value: "blog", label: "블로그" },
  { value: "etc", label: "기타" },
];

export function MemoForm() {
  const [state, formAction, pending] = useActionState(createMemo, initialState);

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
          defaultValue=""
          className="w-40 rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="" disabled>
            선택
          </option>
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
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="files" className="text-sm font-medium text-ink">
          파일첨부
        </label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none file:mr-3 file:rounded file:border-0 file:bg-canvas-cream file:px-3 file:py-1 file:text-sm"
        />
        <p className="text-xs text-ink-mute">이미지·PDF·Office 문서·ZIP, 파일당 12MB 이하, 최대 5개</p>
      </div>

      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "저장 중..." : "등록"}
      </button>
    </form>
  );
}
