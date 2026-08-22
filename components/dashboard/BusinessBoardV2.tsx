"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BusinessProjectV2 } from "@/lib/queries/businessProjectsV2";
import {
  createBusinessProjectV2,
  updateBusinessProjectV2,
  deleteBusinessProjectV2,
  moveBusinessProjectV2Stage,
  createBusinessProjectV2Comment,
  deleteBusinessProjectV2Comment,
  createBusinessProjectV2HistoryEntry,
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

// 상태 배지 배경·글자색 — STATUS_DOT과 같은 색 계열을 pill 형태로 확장해 한눈에 구분되게 한다.
const STATUS_BADGE: Record<string, string> = {
  "진행 중": "bg-canvas-lavender text-link-blue",
  "시작 전": "bg-[#f0f0f2] text-ink-mute",
  완료: "bg-semantic-success/15 text-semantic-success",
  보류: "bg-semantic-error/10 text-semantic-error",
  실패: "bg-[#f0f0f2] text-ink-mute",
};

// 단계별 컬러 셋트 — 카드의 단계 배지와 칸반 컬럼 상단 헤더가 같은 색으로 짝을 이루게 한다.
const STAGE_COLORS: Record<string, { badge: string; header: string }> = {
  "①영업진행": { badge: "border-[#0066cc]/30 bg-[#e8f2ff] text-[#0066cc]", header: "bg-[#e8f2ff] text-[#0066cc]" },
  "②사업제안": { badge: "border-[#7c3aed]/30 bg-[#f3ecff] text-[#7c3aed]", header: "bg-[#f3ecff] text-[#7c3aed]" },
  "③제안서작성": { badge: "border-[#0d9488]/30 bg-[#e0f7f5] text-[#0d9488]", header: "bg-[#e0f7f5] text-[#0d9488]" },
  "④사업수행": { badge: "border-[#c2740c]/30 bg-[#fff4e0] text-[#c2740c]", header: "bg-[#fff4e0] text-[#c2740c]" },
  "⑤사업완료": { badge: "border-[#248a3d]/30 bg-[#e6f7ec] text-[#248a3d]", header: "bg-[#e6f7ec] text-[#248a3d]" },
};
const STAGE_FALLBACK = { badge: "border-hairline bg-[#f0f0f2] text-ink-mute", header: "bg-background text-ink" };

function stageColors(stage: string | null): { badge: string; header: string } {
  return STAGE_COLORS[stage ?? ""] ?? STAGE_FALLBACK;
}

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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProjectHistory({ project }: { project: BusinessProjectV2 }) {
  const action = createBusinessProjectV2HistoryEntry.bind(null, project.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4">
      <div>
        <strong className="text-sm font-bold text-ink">히스토리</strong>
        <p className="mt-0.5 text-xs text-ink-mute">
          진행 상황·변경 사항을 시간순으로 남깁니다. 등록한 기록은 삭제할 수 없습니다.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {project.history.map((h) => (
          <div key={h.id} className="rounded-sm border border-hairline bg-background p-3 text-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-ink-mute">
              <span className="font-medium text-ink">{h.authorEmail}</span>
              <span>{formatDateTime(h.createdAt)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-ink">{h.content}</p>
          </div>
        ))}
        {project.history.length === 0 && (
          <p className="text-sm text-ink-mute">아직 등록된 히스토리가 없습니다.</p>
        )}
      </div>
      <form action={formAction} className="flex flex-col gap-2">
        <textarea
          name="content"
          required
          rows={3}
          placeholder="예: 발주처와 통화, 견적 재작성 요청"
          className="rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-primary px-5 py-1.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "등록 중..." : "히스토리 등록"}
        </button>
      </form>
    </div>
  );
}

function ProjectComments({ project }: { project: BusinessProjectV2 }) {
  const router = useRouter();
  const action = createBusinessProjectV2Comment.bind(null, project.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [, startTransition] = useTransition();

  function handleDelete(commentId: string) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteBusinessProjectV2Comment(commentId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4">
      <strong className="text-sm font-bold text-ink">댓글 {project.comments.length}개</strong>
      <div className="flex flex-col gap-2">
        {project.comments.map((c) => (
          <div key={c.id} className="rounded-sm border border-hairline bg-background p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-ink">{c.authorEmail}</span>
              <div className="flex items-center gap-2 text-xs text-ink-mute">
                <span>{formatDateTime(c.createdAt)}</span>
                {c.isOwn && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-semantic-error hover:underline"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-ink">{c.content}</p>
          </div>
        ))}
        {project.comments.length === 0 && (
          <p className="text-sm text-ink-mute">아직 댓글이 없습니다. 의견을 남겨보세요.</p>
        )}
      </div>
      <form action={formAction} className="flex flex-col gap-2">
        <textarea
          name="content"
          required
          rows={3}
          placeholder="의견을 남겨주세요"
          className="rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-primary px-5 py-1.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "등록 중..." : "댓글 등록"}
        </button>
      </form>
    </div>
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
  const statusBadge = STATUS_BADGE[project.status] || "bg-[#f0f0f2] text-ink-mute";
  const date = formatDate(project.submissionDate);

  function handleStageChange(stage: string) {
    startTransition(() => {
      void moveBusinessProjectV2Stage(project.id, stage || null);
    });
  }

  return (
    <div
      onClick={onEdit}
      className="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-hairline bg-background p-2 text-xs hover:border-primary"
    >
      <div className="flex flex-col gap-1">
        <span className="truncate font-medium text-ink" title={project.title}>
          {project.title}
        </span>
        <span className={`flex w-fit items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium ${statusBadge}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
          {project.status}
        </span>
        {date && <span className="truncate text-ink-mute">{date}</span>}
        {project.orgName && (
          <span className="truncate text-ink-mute" title={project.orgName}>
            {project.orgName}
          </span>
        )}
      </div>
      <select
        value={project.stage ?? ""}
        onChange={(e) => handleStageChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className={`cursor-pointer rounded-sm border px-1.5 py-1 text-[11px] font-medium outline-none focus:border-primary ${stageColors(project.stage).badge}`}
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
            <tr
              key={p.id}
              onClick={() => onEdit(p)}
              className="cursor-pointer border-t border-hairline hover:bg-[#f7f7f8]"
            >
              <td className="px-4 py-2">
                <span
                  className={`flex w-fit items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
                    STATUS_BADGE[p.status] || "bg-[#f0f0f2] text-ink-mute"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status] || "bg-ink-mute"}`} />
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className="text-left text-link-blue hover:underline">{p.title}</span>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex w-fit rounded-md border px-1.5 py-0.5 text-xs font-medium ${stageColors(p.stage).badge}`}
                >
                  {p.stage ?? "미분류"}
                </span>
              </td>
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
  // 선택한 프로젝트 객체를 그대로 담아두면 댓글 등록 후 revalidate로 projects가
  // 새로고침돼도 이 스냅샷은 갱신되지 않는다 — id만 들고 있다가 매 렌더마다
  // projects에서 다시 찾아 항상 최신 데이터(새 댓글 포함)를 보여준다.
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const editingProject = editingId && editingId !== "new" ? (projects.find((p) => p.id === editingId) ?? null) : null;
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
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {editingId === "new" && <ProjectForm project={null} onDone={() => setEditingId(null)} />}
      {editingProject && (
        <div className="flex flex-col gap-4">
          <ProjectForm project={editingProject} onDone={() => setEditingId(null)} />
          <button
            type="button"
            onClick={() => handleDelete(editingProject.id)}
            className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
          >
            이 사업 삭제
          </button>
          <ProjectHistory project={editingProject} />
          <ProjectComments project={editingProject} />
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
              onClick={() => setEditingId("new")}
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
                <div
                  className={`flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-semibold ${stageColors(stage).header}`}
                >
                  <span className="truncate">{stage}</span>
                  <span className="shrink-0 font-normal opacity-70">{items.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {items.map((p) => (
                    <ProjectCard key={p.id} project={p} onEdit={() => setEditingId(p.id)} />
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
          <BusinessListView projects={visible} onEdit={(p) => setEditingId(p.id)} />
        )}
      </div>
    </div>
  );
}
