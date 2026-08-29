"use client";

import { useActionState } from "react";
import { addCompetitor, deleteCompetitor, type AddCompetitorState } from "@/app/dashboard/actions/competitors";
import type { Competitor } from "@/lib/queries/competitors";

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
      style={{ display: "inline" }}
    >
      <button
        type="submit"
        aria-label="블로그 삭제"
        style={{ marginLeft: 4, background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer" }}
        className="text-muted"
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
    <details className="card">
      <summary style={{ display: "flex", cursor: "pointer", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }} className="text-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
        </svg>
        모니터링 블로그 관리 ({competitors.length}개)
      </summary>

      <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {competitors.map((c) => (
            <span key={c.id} className="tag tag-outline" style={{ display: "inline-flex", alignItems: "center" }}>
              {c.name}
              {c.blogId && (
                <span className="text-muted" style={{ marginLeft: 4 }}>
                  ({c.blogId})
                </span>
              )}
              <DeleteButton id={c.id} name={c.name} path={path} />
            </span>
          ))}
          {competitors.length === 0 && (
            <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
              등록된 블로그가 없습니다.
            </p>
          )}
        </div>

        <form action={formAction} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <input name="name" type="text" required placeholder="이름 (예: 에어패스)" className="input" style={{ width: 128 }} />
          <input name="domain" type="text" placeholder="도메인 (선택, 예: airpass.co.kr)" className="input" style={{ width: 192 }} />
          <input name="blogId" type="text" placeholder="네이버 블로그 ID (선택, 예: airpass-blog)" className="input" style={{ width: 192 }} />
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "추가 중..." : "추가"}
          </button>
        </form>
        <p className="text-muted" style={{ margin: 0, fontSize: 11 }}>
          네이버 블로그 ID는 blog.naver.com/&lt;ID&gt; 의 &lt;ID&gt; 부분입니다. 비워두면 포스팅
          주기·SOV 집계 대상에서는 빠지고 명단에만 남습니다. 삭제해도 지금까지 수집된 데이터는
          유지되며, 다음 자동 수집부터만 제외됩니다.
        </p>
        {state?.success && <p style={{ color: "var(--color-accent-700)", fontSize: 13, margin: 0 }}>{state.success}</p>}
        {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13, margin: 0 }}>{state.error}</p>}
      </div>
    </details>
  );
}
