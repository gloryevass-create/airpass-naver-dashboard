"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CooperationProject, CooperationProjectHistoryEntry } from "@/lib/queries/cooperationProjects";
import {
  createCooperationProject,
  updateCooperationProject,
  deleteCooperationProject,
  moveCooperationProjectRelation,
  createCooperationProjectComment,
  deleteCooperationProjectComment,
  createCooperationProjectHistoryEntry,
  updateCooperationProjectHistoryEntry,
} from "@/app/dashboard/actions/cooperationProjects";

const RELATION_TYPES = ["콘텐츠", "콘텐츠/하드웨어", "공동생산 판매", "제품 판매", "자재구매", "일반", "비즈니스협업"];
const WORK_TYPES = ["아이디어", "시장조사", "기획", "개발", "상품화", "제품생산", "조달등록", "자료", "판매", "첫 미팅"];
const STATUSES = ["시작 전", "진행 중", "완료", "종료"];
const TERMINAL_STATUSES = new Set(["완료", "종료"]);

const STATUS_DOT: Record<string, string> = {
  "진행 중": "bg-link-blue",
  "시작 전": "bg-ink-mute",
  완료: "bg-semantic-success",
  종료: "bg-ink-mute",
};

const STATUS_BADGE: Record<string, string> = {
  "진행 중": "bg-canvas-lavender text-link-blue",
  "시작 전": "bg-[#f0f0f2] text-ink-mute",
  완료: "bg-semantic-success/15 text-semantic-success",
  종료: "bg-[#f0f0f2] text-ink-mute",
};

const RELATION_HEADER_COLOR: Record<string, string> = {
  콘텐츠: "bg-[#e8f2ff] text-[#0066cc]",
  "콘텐츠/하드웨어": "bg-[#fff4e0] text-[#c2740c]",
  "공동생산 판매": "bg-[#f3ecff] text-[#7c3aed]",
  "제품 판매": "bg-[#e0f7f5] text-[#0d9488]",
  자재구매: "bg-[#ffe8ec] text-[#c2264c]",
  일반: "bg-background text-ink",
  비즈니스협업: "bg-[#e6f7ec] text-[#248a3d]",
};

function relationHeaderColor(relation: string): string {
  return RELATION_HEADER_COLOR[relation] ?? "bg-background text-ink";
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
  project: CooperationProject | null;
  onDone: () => void;
}) {
  const action = project ? updateCooperationProject : createCooperationProject;
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
          이름 *
          <input
            name="title"
            defaultValue={project?.title ?? ""}
            required
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          업체
          <input
            name="company"
            defaultValue={project?.company ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          관계
          <select
            name="relationType"
            defaultValue={project?.relationType ?? ""}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">미분류</option>
            {RELATION_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          업무
          <select
            name="workType"
            defaultValue={project?.workType ?? ""}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">없음</option>
            {WORK_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
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
          프로젝트 시작일
          <input
            name="projectStartDate"
            type="date"
            defaultValue={toDateInputValue(project?.projectStartDate ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          프로젝트 종료일
          <input
            name="projectEndDate"
            type="date"
            defaultValue={toDateInputValue(project?.projectEndDate ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          메인담당 (쉼표로 구분)
          <input
            name="mainAssignees"
            defaultValue={project?.mainAssignees.join(", ") ?? ""}
            placeholder="예: 홍길동, 김철수"
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          서브담당 (쉼표로 구분)
          <input
            name="subAssignees"
            defaultValue={project?.subAssignees.join(", ") ?? ""}
            placeholder="예: 홍길동, 김철수"
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          내용
          <textarea
            name="content"
            defaultValue={project?.content ?? ""}
            rows={3}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          AI 키워드 요약
          <textarea
            name="aiKeywords"
            defaultValue={project?.aiKeywords ?? ""}
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
          {pending ? "저장 중..." : project ? "수정 저장" : "협업 추가"}
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

function HistoryEntryRow({ entry }: { entry: CooperationProjectHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const action = updateCooperationProjectHistoryEntry.bind(null, entry.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const firstLine = entry.content.split("\n")[0];
  const hasMore = entry.content.includes("\n");
  const wasEdited = entry.updatedAt !== entry.createdAt;

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await formAction(formData);
          setEditing(false);
        }}
        className="flex flex-col gap-2 rounded-sm border border-hairline bg-background p-3 text-sm"
      >
        <textarea
          name="content"
          required
          defaultValue={entry.content}
          rows={4}
          className="rounded-sm border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-1 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
          >
            {pending ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-hairline px-4 py-1 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
          >
            취소
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-sm border border-hairline bg-background p-3 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className={`min-w-0 flex-1 text-ink ${expanded ? "whitespace-pre-wrap" : "truncate"}`}>
          {expanded ? entry.content : firstLine}
          {!expanded && hasMore && <span className="text-ink-mute"> …</span>}
        </span>
        <span className="shrink-0 text-xs text-ink-mute">{formatDateTime(entry.createdAt)}</span>
      </button>
      {expanded && (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-mute">
          <span>
            {entry.authorEmail}
            {wasEdited && <span className="ml-1">(수정됨)</span>}
          </span>
          {entry.isOwn && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="text-link-blue hover:underline"
            >
              수정
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectHistory({ project }: { project: CooperationProject }) {
  const action = createCooperationProjectHistoryEntry.bind(null, project.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4">
      <div>
        <strong className="text-sm font-bold text-ink">히스토리</strong>
        <p className="mt-0.5 text-xs text-ink-mute">
          진행 상황·변경 사항을 시간순으로 남깁니다. 등록한 기록은 삭제할 수 없지만, 본인이 남긴
          기록은 수정할 수 있습니다.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {project.history.map((h) => (
          <HistoryEntryRow key={h.id} entry={h} />
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
          placeholder="예: 담당자와 통화, 견적 재요청"
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

function ProjectComments({ project }: { project: CooperationProject }) {
  const router = useRouter();
  const action = createCooperationProjectComment.bind(null, project.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [, startTransition] = useTransition();

  function handleDelete(commentId: string) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteCooperationProjectComment(commentId);
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
  project: CooperationProject;
  onEdit: () => void;
}) {
  const [, startTransition] = useTransition();
  const dotColor = STATUS_DOT[project.status] || "bg-ink-mute";
  const statusBadge = STATUS_BADGE[project.status] || "bg-[#f0f0f2] text-ink-mute";
  const date = formatDate(project.projectStartDate);

  function handleRelationChange(relationType: string) {
    startTransition(() => {
      void moveCooperationProjectRelation(project.id, relationType || null);
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
        {project.company && (
          <span className="truncate text-ink-mute" title={project.company}>
            {project.company}
          </span>
        )}
      </div>
      <select
        value={project.relationType ?? ""}
        onChange={(e) => handleRelationChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="rounded-sm border border-hairline bg-canvas-cream px-1.5 py-1 text-[11px] font-medium text-ink-mute outline-none focus:border-primary"
      >
        <option value="">미분류</option>
        {RELATION_TYPES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}

function CooperationListView({
  projects,
  onEdit,
}: {
  projects: CooperationProject[];
  onEdit: (project: CooperationProject) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-sm border border-hairline bg-canvas-cream">
      <table className="w-full text-sm">
        <thead className="bg-background text-left text-ink-mute">
          <tr>
            <th className="whitespace-nowrap px-4 py-2 font-medium">상태</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">이름</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">관계</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">업체</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">담당자</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">시작일</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr
              key={p.id}
              onClick={() => onEdit(p)}
              className="cursor-pointer border-t border-hairline hover:bg-[#f7f7f8]"
            >
              <td className="whitespace-nowrap px-4 py-2">
                <span
                  className={`flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${
                    STATUS_BADGE[p.status] || "bg-[#f0f0f2] text-ink-mute"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status] || "bg-ink-mute"}`} />
                  {p.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className="text-left text-link-blue hover:underline">{p.title}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className="inline-flex w-fit whitespace-nowrap rounded-md border border-hairline bg-canvas-cream px-1.5 py-0.5 text-xs font-medium text-ink-mute">
                  {p.relationType ?? "미분류"}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{p.company ?? "-"}</td>
              <td className="whitespace-nowrap px-4 py-2 text-ink-mute">
                {[...p.mainAssignees, ...p.subAssignees].join(", ") || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{formatDate(p.projectStartDate) ?? "-"}</td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ink-mute">
                조건에 맞는 협업이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CooperationBoard({ projects }: { projects: CooperationProject[] }) {
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const editingProject = editingId && editingId !== "new" ? (projects.find((p) => p.id === editingId) ?? null) : null;
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    if (statusFilter) return projects.filter((p) => p.status === statusFilter);
    return showAll ? projects : projects.filter((p) => !TERMINAL_STATUSES.has(p.status));
  }, [projects, showAll, statusFilter]);

  const byRelation = useMemo(() => {
    const map = new Map<string, CooperationProject[]>();
    for (const r of RELATION_TYPES) map.set(r, []);
    const etc: CooperationProject[] = [];
    for (const p of visible) {
      if (p.relationType && map.has(p.relationType)) {
        map.get(p.relationType)!.push(p);
      } else {
        etc.push(p);
      }
    }
    if (etc.length > 0) map.set("미분류", etc);
    return map;
  }, [visible]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of STATUSES) counts.set(s, 0);
    for (const p of projects) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
    return counts;
  }, [projects]);

  function handleDelete(id: string) {
    if (!window.confirm("이 협업 항목을 삭제할까요?")) return;
    startTransition(() => {
      void deleteCooperationProject(id);
    });
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          className={`flex flex-col gap-1 rounded-sm border bg-primary p-3 text-left text-white transition-shadow ${
            statusFilter === null ? "border-current shadow-[0_0_0_2px_currentColor]" : "border-primary"
          }`}
        >
          <span className="text-xs font-semibold">전체</span>
          <span className="text-2xl font-bold tracking-tight">{projects.length.toLocaleString("ko-KR")}</span>
        </button>
        {STATUSES.map((s) => {
          const badge = STATUS_BADGE[s] || "bg-[#f0f0f2] text-ink-mute";
          const active = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === s ? null : s))}
              className={`flex flex-col gap-1 rounded-sm border p-3 text-left transition-shadow ${badge} ${
                active ? "border-current shadow-[0_0_0_2px_currentColor]" : "border-hairline"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[s] || "bg-ink-mute"}`} />
                {s}
              </span>
              <span className="text-2xl font-bold tracking-tight">
                {(statusCounts.get(s) ?? 0).toLocaleString("ko-KR")}
              </span>
            </button>
          );
        })}
      </div>
      {statusFilter && (
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          className="w-fit text-xs text-link-blue hover:underline"
        >
          &ldquo;{statusFilter}&rdquo; 필터 해제
        </button>
      )}

      {editingId === "new" && <ProjectForm project={null} onDone={() => setEditingId(null)} />}
      {editingProject && (
        <div className="flex flex-col gap-4">
          <ProjectForm project={editingProject} onDone={() => setEditingId(null)} />
          <button
            type="button"
            onClick={() => handleDelete(editingProject.id)}
            className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
          >
            이 협업 삭제
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
            완료·종료 포함
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
                보드
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
              + 새 협업 추가
            </button>
          </div>
        </div>

        {view === "board" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from(byRelation.entries()).map(([relation, items]) => (
              <div key={relation} className="flex min-w-0 flex-col gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold ${relationHeaderColor(relation)}`}
                >
                  <span className="truncate">{relation}</span>
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
          <CooperationListView projects={visible} onEdit={(p) => setEditingId(p.id)} />
        )}
      </div>
    </div>
  );
}
