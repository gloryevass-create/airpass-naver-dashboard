"use client";

import { useActionState } from "react";
import {
  addMonitorKeyword,
  deleteMonitorKeyword,
  type AddKeywordState,
} from "@/app/dashboard/actions/monitor-keywords";
import type { MonitorKeyword, MonitorTrack } from "@/lib/queries/monitorKeywords";

const initialState: AddKeywordState = undefined;

function DeleteButton({ id, path }: { id: string; path: string }) {
  return (
    <form action={deleteMonitorKeyword.bind(null, id, path)}>
      <button
        type="submit"
        aria-label="키워드 삭제"
        className="ml-1 text-ink-mute hover:text-semantic-error"
      >
        ×
      </button>
    </form>
  );
}

export function MonitorKeywordManager({
  track,
  keywords,
  path,
}: {
  track: MonitorTrack;
  keywords: MonitorKeyword[];
  path: string;
}) {
  const action = addMonitorKeyword.bind(null, track, path);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <details className="rounded-xl border border-hairline p-4">
      <summary className="cursor-pointer text-sm font-semibold text-ink-mute">
        검색 키워드 관리 ({keywords.length}개)
      </summary>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span
              key={k.id}
              className="flex items-center rounded-full bg-canvas-cream px-3 py-1 text-xs text-ink"
            >
              {k.keyword}
              <DeleteButton id={k.id} path={path} />
            </span>
          ))}
          {keywords.length === 0 && (
            <p className="text-xs text-ink-mute">등록된 키워드가 없습니다.</p>
          )}
        </div>

        <form action={formAction} className="flex items-center gap-2">
          <input
            name="keyword"
            type="text"
            required
            placeholder="새 키워드 추가"
            className="rounded border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
          >
            {pending ? "추가 및 수집 중..." : "추가"}
          </button>
        </form>
        {state?.success && <p className="text-sm text-semantic-success">{state.success}</p>}
        {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      </div>
    </details>
  );
}
