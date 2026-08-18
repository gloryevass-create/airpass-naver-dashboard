"use client";

import { useActionState } from "react";
import { addCompetitor, deleteCompetitor, type AddCompetitorState } from "@/app/dashboard/actions/competitors";
import type { Competitor } from "@/lib/queries/competitors";
import { NavIcon } from "@/components/icons/NavIcon";

const initialState: AddCompetitorState = undefined;

function DeleteButton({ id, name, path }: { id: string; name: string; path: string }) {
  return (
    <form
      action={deleteCompetitor.bind(null, id, path)}
      onSubmit={(e) => {
        if (!confirm(`"${name}"을(를) 삭제하시겠습니까? 다음 자동 수집부터 제외됩니다(지금까지 수집된 데이터는 유지됩니다).`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="블로그 삭제"
        className="ml-1 text-ink-mute hover:text-semantic-error"
      >
        ×
      </button>
    </form>
  );
}

export function CompetitorBlogManager({ competitors, path }: { competitors: Competitor[]; path: string }) {
  const action = addCompetitor.bind(null, path);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <details className="rounded-xl border border-hairline p-4">
      <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-mute">
        <NavIcon name="tag" className="h-4 w-4" />
        모니터링 블로그 관리 ({competitors.length}개)
      </summary>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {competitors.map((c) => (
            <span
              key={c.id}
              className="flex items-center rounded-full bg-canvas-cream px-3 py-1 text-xs text-ink"
            >
              {c.name}
              {c.blogId && <span className="ml-1 text-ink-mute">({c.blogId})</span>}
              <DeleteButton id={c.id} name={c.name} path={path} />
            </span>
          ))}
          {competitors.length === 0 && (
            <p className="text-xs text-ink-mute">등록된 블로그가 없습니다.</p>
          )}
        </div>

        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input
            name="name"
            type="text"
            required
            placeholder="이름 (예: 에어패스)"
            className="w-32 rounded border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
          <input
            name="domain"
            type="text"
            placeholder="도메인 (선택, 예: airpass.co.kr)"
            className="w-48 rounded border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
          <input
            name="blogId"
            type="text"
            placeholder="네이버 블로그 ID (선택, 예: airpass-blog)"
            className="w-48 rounded border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
          >
            {pending ? "추가 중..." : "추가"}
          </button>
        </form>
        <p className="text-[11px] text-ink-mute">
          네이버 블로그 ID는 blog.naver.com/&lt;ID&gt; 의 &lt;ID&gt; 부분입니다. 비워두면 포스팅
          주기·SOV 집계 대상에서는 빠지고 명단에만 남습니다. 삭제해도 지금까지 수집된 데이터는
          유지되며, 다음 자동 수집부터만 제외됩니다.
        </p>
        {state?.success && <p className="text-sm text-semantic-success">{state.success}</p>}
        {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      </div>
    </details>
  );
}
