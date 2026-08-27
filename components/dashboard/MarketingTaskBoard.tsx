"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MarketingTask, MarketingTaskHistoryEntry } from "@/lib/queries/marketingTasks";
import {
  createMarketingTask,
  updateMarketingTask,
  deleteMarketingTask,
  moveMarketingTaskCategory,
  createMarketingTaskComment,
  deleteMarketingTaskComment,
  createMarketingTaskHistoryEntry,
  updateMarketingTaskHistoryEntry,
} from "@/app/dashboard/actions/marketingTasks";
import { MemberMultiSelect } from "@/components/dashboard/MemberMultiSelect";

const CATEGORIES = ["문서", "영상", "사진", "웹페이지", "광고"];
const WORK_TYPES = ["브로슈어", "매뉴얼", "홈페이지", "SNS", "영상", "기타"];
const STAGES = ["기획", "제작", "수행"];
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

const CATEGORY_HEADER_COLOR: Record<string, string> = {
  문서: "bg-[#e8f2ff] text-[#0066cc]",
  영상: "bg-[#fff4e0] text-[#c2740c]",
  사진: "bg-[#f3ecff] text-[#7c3aed]",
  웹페이지: "bg-[#e0f7f5] text-[#0d9488]",
  광고: "bg-[#ffe8ec] text-[#c2264c]",
};

function categoryHeaderColor(category: string): string {
  return CATEGORY_HEADER_COLOR[category] ?? "bg-background text-ink";
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function TaskForm({
  task,
  members,
  onDone,
}: {
  task: MarketingTask | null;
  members: string[];
  onDone: () => void;
}) {
  const action = task ? updateMarketingTask : createMarketingTask;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4"
    >
      {task && <input type="hidden" name="id" value={task.id} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          업무명 *
          <input
            name="title"
            defaultValue={task?.title ?? ""}
            required
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          분류
          <select
            name="category"
            defaultValue={task?.category ?? ""}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">미분류</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          업무 유형
          <select
            name="workType"
            defaultValue={task?.workType ?? ""}
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
          현황
          <select
            name="stage"
            defaultValue={task?.stage ?? ""}
            className="rounded-sm border border-hairline bg-background px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">없음</option>
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
            defaultValue={task?.status ?? "시작 전"}
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
          종료 예정일
          <input
            name="dueDate"
            type="date"
            defaultValue={toDateInputValue(task?.dueDate ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          종료 예정일(범위 끝, 선택)
          <input
            name="dueDateEnd"
            type="date"
            defaultValue={toDateInputValue(task?.dueDateEnd ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <div className="sm:col-span-2">
          <MemberMultiSelect name="assignees" label="담당자" members={members} defaultValue={task?.assignees ?? []} />
        </div>
        <label className="flex flex-col gap-1 text-xs text-ink-mute sm:col-span-2">
          내용
          <textarea
            name="content"
            defaultValue={task?.content ?? ""}
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
          {pending ? "저장 중..." : task ? "수정 저장" : "업무 추가"}
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

function HistoryEntryRow({ entry }: { entry: MarketingTaskHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const action = updateMarketingTaskHistoryEntry.bind(null, entry.id);
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

function TaskHistory({ task }: { task: MarketingTask }) {
  const action = createMarketingTaskHistoryEntry.bind(null, task.id);
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
        {task.history.map((h) => (
          <HistoryEntryRow key={h.id} entry={h} />
        ))}
        {task.history.length === 0 && <p className="text-sm text-ink-mute">아직 등록된 히스토리가 없습니다.</p>}
      </div>
      <form action={formAction} className="flex flex-col gap-2">
        <textarea
          name="content"
          required
          rows={3}
          placeholder="예: 시안 컨펌 완료, 인쇄 발주"
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

function TaskComments({ task }: { task: MarketingTask }) {
  const router = useRouter();
  const action = createMarketingTaskComment.bind(null, task.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [, startTransition] = useTransition();

  function handleDelete(commentId: string) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteMarketingTaskComment(commentId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4">
      <strong className="text-sm font-bold text-ink">댓글 {task.comments.length}개</strong>
      <div className="flex flex-col gap-2">
        {task.comments.map((c) => (
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
        {task.comments.length === 0 && <p className="text-sm text-ink-mute">아직 댓글이 없습니다. 의견을 남겨보세요.</p>}
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

function TaskCard({
  task,
  onEdit,
}: {
  task: MarketingTask;
  onEdit: () => void;
}) {
  const [, startTransition] = useTransition();
  const dotColor = STATUS_DOT[task.status] || "bg-ink-mute";
  const statusBadge = STATUS_BADGE[task.status] || "bg-[#f0f0f2] text-ink-mute";
  const date = formatDate(task.dueDate);

  function handleCategoryChange(category: string) {
    startTransition(() => {
      void moveMarketingTaskCategory(task.id, category || null);
    });
  }

  return (
    <div
      onClick={onEdit}
      className="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-hairline bg-background p-2 text-xs hover:border-primary"
    >
      <div className="flex flex-col gap-1">
        <span className="truncate font-medium text-ink" title={task.title}>
          {task.title}
        </span>
        <span className={`flex w-fit items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium ${statusBadge}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
          {task.status}
        </span>
        {date && <span className="truncate text-ink-mute">{date}</span>}
        {task.workType && (
          <span className="truncate text-ink-mute" title={task.workType}>
            {task.workType}
          </span>
        )}
      </div>
      <select
        value={task.category ?? ""}
        onChange={(e) => handleCategoryChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="rounded-sm border border-hairline bg-canvas-cream px-1.5 py-1 text-[11px] font-medium text-ink-mute outline-none focus:border-primary"
      >
        <option value="">미분류</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

function MarketingTaskListView({
  tasks,
  onEdit,
}: {
  tasks: MarketingTask[];
  onEdit: (task: MarketingTask) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-sm border border-hairline bg-canvas-cream">
      <table className="w-full text-sm">
        <thead className="bg-background text-left text-ink-mute">
          <tr>
            <th className="whitespace-nowrap px-4 py-2 font-medium">상태</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">업무명</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">분류</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">현황</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">담당자</th>
            <th className="whitespace-nowrap px-4 py-2 font-medium">종료 예정일</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr
              key={t.id}
              onClick={() => onEdit(t)}
              className="cursor-pointer border-t border-hairline hover:bg-[#f7f7f8]"
            >
              <td className="whitespace-nowrap px-4 py-2">
                <span
                  className={`flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${
                    STATUS_BADGE[t.status] || "bg-[#f0f0f2] text-ink-mute"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[t.status] || "bg-ink-mute"}`} />
                  {t.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className="text-left text-link-blue hover:underline">{t.title}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className="inline-flex w-fit whitespace-nowrap rounded-md border border-hairline bg-canvas-cream px-1.5 py-0.5 text-xs font-medium text-ink-mute">
                  {t.category ?? "미분류"}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{t.stage ?? "-"}</td>
              <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{t.assignees.join(", ") || "-"}</td>
              <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{formatDate(t.dueDate) ?? "-"}</td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ink-mute">
                조건에 맞는 업무가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function MarketingTaskBoard({ tasks, members }: { tasks: MarketingTask[]; members: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const editingTask = editingId && editingId !== "new" ? (tasks.find((t) => t.id === editingId) ?? null) : null;
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    if (statusFilter) return tasks.filter((t) => t.status === statusFilter);
    return showAll ? tasks : tasks.filter((t) => !TERMINAL_STATUSES.has(t.status));
  }, [tasks, showAll, statusFilter]);

  const byCategory = useMemo(() => {
    const map = new Map<string, MarketingTask[]>();
    for (const c of CATEGORIES) map.set(c, []);
    const etc: MarketingTask[] = [];
    for (const t of visible) {
      if (t.category && map.has(t.category)) {
        map.get(t.category)!.push(t);
      } else {
        etc.push(t);
      }
    }
    if (etc.length > 0) map.set("미분류", etc);
    return map;
  }, [visible]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of STATUSES) counts.set(s, 0);
    for (const t of tasks) counts.set(t.status, (counts.get(t.status) ?? 0) + 1);
    return counts;
  }, [tasks]);

  function handleDelete(id: string) {
    if (!window.confirm("이 업무 항목을 삭제할까요?")) return;
    startTransition(() => {
      void deleteMarketingTask(id);
    });
    setEditingId(null);
  }

  const isEditing = editingId === "new" || Boolean(editingTask);

  return (
    <div className="flex flex-col gap-4">
      {isEditing ? (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="flex w-fit items-center gap-1 text-sm font-medium text-ink-mute hover:text-ink"
          >
            ← 목록으로
          </button>
          {editingId === "new" && <TaskForm task={null} members={members} onDone={() => setEditingId(null)} />}
          {editingTask && (
            <>
              <TaskForm task={editingTask} members={members} onDone={() => setEditingId(null)} />
              <button
                type="button"
                onClick={() => handleDelete(editingTask.id)}
                className="w-fit rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
              >
                이 업무 삭제
              </button>
              <TaskHistory task={editingTask} />
              <TaskComments task={editingTask} />
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className={`flex flex-col gap-1 rounded-sm border bg-primary p-3 text-left text-white transition-shadow ${
                statusFilter === null ? "border-current shadow-[0_0_0_2px_currentColor]" : "border-primary"
              }`}
            >
              <span className="text-xs font-semibold">전체</span>
              <span className="text-2xl font-bold tracking-tight">{tasks.length.toLocaleString("ko-KR")}</span>
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
                  + 새 업무 추가
                </button>
              </div>
            </div>

            {view === "board" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from(byCategory.entries()).map(([category, items]) => (
                  <div key={category} className="flex min-w-0 flex-col gap-2">
                    <div
                      className={`flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold ${categoryHeaderColor(category)}`}
                    >
                      <span className="truncate">{category}</span>
                      <span className="shrink-0 font-normal opacity-70">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {items.map((t) => (
                        <TaskCard key={t.id} task={t} onEdit={() => setEditingId(t.id)} />
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
              <MarketingTaskListView tasks={visible} onEdit={(t) => setEditingId(t.id)} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
