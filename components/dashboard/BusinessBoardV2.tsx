"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import type { BusinessProjectV2 } from "@/lib/queries/businessProjectsV2";
import {
  createBusinessProjectV2,
  updateBusinessProjectV2,
  deleteBusinessProjectV2,
  moveBusinessProjectV2Stage,
} from "@/app/dashboard/actions/businessProjectsV2";

const STAGES = ["①영업진행", "②사업제안", "③제안서작성", "④사업수행", "⑤사업완료"];
const STATUSES = ["시작 전", "진행 중", "완료", "보류", "실패"];
const TERMINAL_STATUSES = new Set(["완료", "실패", "보류"]);

const STATUS_DOT: Record<string, string> = {
  "진행 중": "bg-link-blue",
  "시작 전": "bg-ink-mute",
  완료: "bg-semantic-success",
  보류: "bg-semantic-error",
  실패: "bg-ink-mute",
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function ProjectForm({
  project,
  onDone,
}: {
  project: BusinessProjectV2 | null;
  onDone: () => void;
}) {
  const action = project ? updateBusinessProjectV2 : createBusinessProjectV2;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4"
    >
      {project && <input type="hidden" name="id" value={project.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          사업명 *
          <input
            name="title"
            defaultValue={project?.title ?? ""}
            required
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          단계
          <select
            name="stage"
            defaultValue={project?.stage ?? ""}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">미분류</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          진행 상태
          <select
            name="status"
            defaultValue={project?.status ?? "시작 전"}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          발주기관
          <input
            name="orgName"
            defaultValue={project?.orgName ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          참여 형태
          <input
            name="participationType"
            defaultValue={project?.participationType ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          사업 유형
          <input
            name="workType"
            defaultValue={project?.workType ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          결과
          <input
            name="result"
            defaultValue={project?.result ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          금액(원)
          <input
            name="amount"
            type="number"
            defaultValue={project?.amount ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          진행률(%)
          <input
            name="progressRate"
            type="number"
            defaultValue={project?.progressRate ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          제출일
          <input
            name="submissionDate"
            type="date"
            defaultValue={toDateInputValue(project?.submissionDate ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          제출 방법
          <input
            name="submissionMethod"
            defaultValue={project?.submissionMethod ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          발표일
          <input
            name="presentationDate"
            type="date"
            defaultValue={toDateInputValue(project?.presentationDate ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          공사 시작일
          <input
            name="constructionStart"
            type="date"
            defaultValue={toDateInputValue(project?.constructionStart ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          공사 종료일
          <input
            name="constructionEnd"
            type="date"
            defaultValue={toDateInputValue(project?.constructionEnd ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          공사 내용
          <input
            name="constructionContent"
            defaultValue={project?.constructionContent ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          담당자 (쉼표로 구분)
          <input
            name="assignees"
            defaultValue={project?.assignees.join(", ") ?? ""}
            placeholder="예: 홍길동, 김철수"
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          참고 사항
          <textarea
            name="notes"
            defaultValue={project?.notes ?? ""}
            rows={3}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
      </div>
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "저장 중..." : project ? "수정 저장" : "사업 추가"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function ProjectCard({
  project,
  onEdit,
}: {
  project: BusinessProjectV2;
  onEdit: () => void;
}) {
  const [, startTransition] = useTransition();
  const dotColor = STATUS_DOT[project.status] || "bg-ink-mute";
  const date = formatDate(project.submissionDate);

  function handleStageChange(stage: string) {
    startTransition(() => {
      void moveBusinessProjectV2Stage(project.id, stage || null);
    });
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-hairline bg-background p-2 text-xs">
      <button type="button" onClick={onEdit} className="flex flex-col gap-1 text-left hover:text-primary">
        <span className="truncate font-medium text-ink" title={project.title}>
          {project.title}
        </span>
        <span className="flex items-center gap-1.5 text-ink-mute">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
          {project.status}
        </span>
        {date && <span className="truncate text-ink-mute">{date}</span>}
        {project.orgName && (
          <span className="truncate text-ink-mute" title={project.orgName}>
            {project.orgName}
          </span>
        )}
      </button>
      <select
        value={project.stage ?? ""}
        onChange={(e) => handleStageChange(e.target.value)}
        className="rounded-sm border border-hairline bg-canvas-cream px-1.5 py-1 text-[11px] text-ink-mute outline-none focus:border-primary"
      >
        <option value="">미분류</option>
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

function BusinessListView({
  projects,
  onEdit,
}: {
  projects: BusinessProjectV2[];
  onEdit: (project: BusinessProjectV2) => void;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-hairline bg-canvas-cream">
      <table className="w-full text-sm">
        <thead className="bg-background text-left text-ink-mute">
          <tr>
            <th className="px-4 py-2 font-medium">상태</th>
            <th className="px-4 py-2 font-medium">사업명</th>
            <th className="px-4 py-2 font-medium">단계</th>
            <th className="px-4 py-2 font-medium">발주기관</th>
            <th className="px-4 py-2 font-medium">담당자</th>
            <th className="px-4 py-2 font-medium">제출일</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-t border-hairline hover:bg-[#f7f7f8]">
              <td className="px-4 py-2 text-ink-mute">
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status] || "bg-ink-mute"}`} />
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => onEdit(p)}
                  className="text-left text-link-blue hover:underline"
                >
                  {p.title}
                </button>
              </td>
              <td className="px-4 py-2 text-ink-mute">{p.stage ?? "미분류"}</td>
              <td className="px-4 py-2 text-ink-mute">{p.orgName ?? "-"}</td>
              <td className="px-4 py-2 text-ink-mute">{p.assignees.join(", ") || "-"}</td>
              <td className="px-4 py-2 text-ink-mute">{formatDate(p.submissionDate) ?? "-"}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ink-mute">
                조건에 맞는 사업이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function BusinessBoardV2({ projects }: { projects: BusinessProjectV2[] }) {
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const [editing, setEditing] = useState<BusinessProjectV2 | null | "new">(null);
  const [, startTransition] = useTransition();

  const visible = useMemo(
    () => (showAll ? projects : projects.filter((p) => !TERMINAL_STATUSES.has(p.status))),
    [projects, showAll]
  );

  const byStage = useMemo(() => {
    const map = new Map<string, BusinessProjectV2[]>();
    for (const stage of STAGES) map.set(stage, []);
    const etc: BusinessProjectV2[] = [];
    for (const p of visible) {
      if (p.stage && map.has(p.stage)) {
        map.get(p.stage)!.push(p);
      } else {
        etc.push(p);
      }
    }
    if (etc.length > 0) map.set("미분류", etc);
    return map;
  }, [visible]);

  function handleDelete(id: string) {
    if (!window.confirm("이 사업 항목을 삭제할까요?")) return;
    startTransition(() => {
      void deleteBusinessProjectV2(id);
    });
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {editing === "new" && <ProjectForm project={null} onDone={() => setEditing(null)} />}
      {editing && editing !== "new" && (
        <div className="flex flex-col gap-2">
          <ProjectForm project={editing} onDone={() => setEditing(null)} />
          <button
            type="button"
            onClick={() => handleDelete(editing.id)}
            className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
          >
            이 사업 삭제
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-sm border border-hairline bg-canvas-cream p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-ink-mute">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            완료·보류 포함
          </label>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-background p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setView("board")}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  view === "board" ? "bg-primary text-white shadow-sm" : "text-ink-mute hover:text-ink"
                }`}
              >
                목록
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  view === "list" ? "bg-primary text-white shadow-sm" : "text-ink-mute hover:text-ink"
                }`}
              >
                리스트
              </button>
            </div>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
            >
              + 새 사업 추가
            </button>
          </div>
        </div>

        {view === "board" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from(byStage.entries()).map(([stage, items]) => (
              <div key={stage} className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-1.5 rounded-sm bg-background px-2 py-1.5 text-xs font-semibold text-ink">
                  <span className="truncate">{stage}</span>
                  <span className="shrink-0 font-normal text-ink-mute">{items.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {items.map((p) => (
                    <ProjectCard key={p.id} project={p} onEdit={() => setEditing(p)} />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-hairline p-2 text-center text-xs text-ink-mute">
                      없음
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <BusinessListView projects={visible} onEdit={setEditing} />
        )}
      </div>
    </div>
  );
}
