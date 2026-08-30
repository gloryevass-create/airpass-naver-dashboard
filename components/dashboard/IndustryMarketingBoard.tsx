"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from "react";
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

// Business(/dashboard/business)를 Claude Design "Industry" 테마로 다시 그린 것과
// 같은 틀을 재사용한다 — 데이터·서버 액션은 기존 Marketing 그대로, 화면만
// 새로 그렸다(사용자 확인, 2026-08-29).
const CATEGORIES = ["문서", "영상", "사진", "웹페이지", "광고"];
const WORK_TYPES = ["브로슈어", "매뉴얼", "홈페이지", "SNS", "영상", "기타"];
const STAGES = ["기획", "제작", "수행"];
const STATUSES = ["시작 전", "진행 중", "완료", "종료"];
const TERMINAL_STATUSES = new Set(["완료", "종료"]);

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
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

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function ManagerChips({
  name,
  members,
  defaultValue,
}: {
  name: string;
  members: string[];
  defaultValue: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValue));

  function toggle(m: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  return (
    <div className="field">
      <label>담당자</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {members.length === 0 && <span style={{ fontSize: 12 }}>등록된 팀원이 없습니다.</span>}
        {members.map((m) => (
          <label key={m} className={`tag-chip${selected.has(m) ? " active" : ""}`}>
            <input
              type="checkbox"
              name={name}
              value={m}
              checked={selected.has(m)}
              onChange={() => toggle(m)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            {m}
          </label>
        ))}
      </div>
    </div>
  );
}

const DEFAULTS_STORAGE_KEY = "marketing-board:defaults";
const HARD_DEFAULTS = { showArchived: false, view: "kanban" as const };

function loadSavedDefaults(): { showArchived: boolean; view: "kanban" | "list" } | null {
  try {
    const raw = window.localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.showArchived !== "boolean") return null;
    if (parsed.view !== "kanban" && parsed.view !== "list") return null;
    return { showArchived: parsed.showArchived, view: parsed.view };
  } catch {
    return null;
  }
}

function TopSettingsBar({
  showArchived,
  onShowArchivedChange,
  view,
  onViewChange,
}: {
  showArchived: boolean;
  onShowArchivedChange: (v: boolean) => void;
  view: "kanban" | "list";
  onViewChange: (v: "kanban" | "list") => void;
}) {
  const [savedNotice, setSavedNotice] = useState(false);

  function handleSave() {
    window.localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify({ showArchived, view }));
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1500);
  }

  function handleReset() {
    window.localStorage.removeItem(DEFAULTS_STORAGE_KEY);
    onShowArchivedChange(HARD_DEFAULTS.showArchived);
    onViewChange(HARD_DEFAULTS.view);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        width: "100%",
        padding: "6px var(--space-8)",
        background: "#ffffff",
        borderBottom: "1px solid var(--color-divider)",
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", color: "#374151" }}>
          <span>showArchivedDefault</span>
          <span
            role="switch"
            aria-checked={showArchived}
            onClick={() => onShowArchivedChange(!showArchived)}
            style={{
              position: "relative",
              width: 30,
              height: 16,
              borderRadius: 999,
              background: showArchived ? "#3b82f6" : "#d1d5db",
              transition: "background 0.15s",
              flex: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: showArchived ? 16 : 2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                transition: "left 0.15s",
              }}
            />
          </span>
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#374151" }}>
          <span>defaultView</span>
          <select
            value={view}
            onChange={(e) => onViewChange(e.target.value as "kanban" | "list")}
            style={{
              minHeight: 24,
              padding: "2px 6px",
              fontSize: 11,
              width: "auto",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 5,
              color: "#1f2937",
            }}
          >
            <option value="kanban">kanban</option>
            <option value="list">list</option>
          </select>
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        {savedNotice && <span style={{ color: "#3b82f6", fontSize: 11 }}>저장됨</span>}
        <button
          type="button"
          onClick={handleReset}
          style={{ background: "none", border: 0, padding: 0, color: "#6b7280", cursor: "pointer", font: "inherit", fontSize: 11 }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            fontSize: 11,
            fontWeight: 500,
            minHeight: 24,
            padding: "2px 10px",
            background: "#eef1fb",
            border: "1px solid #c7d0e8",
            borderRadius: 5,
            color: "#374151",
            cursor: "pointer",
          }}
        >
          Save as defaults
        </button>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const cls = status === "진행 중" ? "tag tag-accent" : TERMINAL_STATUSES.has(status) ? "tag tag-neutral" : "tag tag-outline";
  return <span className={cls}>{status}</span>;
}

/* ─────────────────────────── 새 업무 추가 다이얼로그 ─────────────────────────── */

function AddTaskDialog({ members, onClose }: { members: string[]; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createMarketingTask, undefined);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !pending && !state?.error) onClose();
    wasPendingRef.current = pending;
  }, [pending, state, onClose]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        style={{ width: "min(640px,100%)", maxHeight: "88vh", overflowY: "auto", background: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 업무 추가
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div className="field">
            <label>업무명 *</label>
            <input className="input" name="title" required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="field">
              <label>분류</label>
              <select className="input" name="category" defaultValue="">
                <option value="">미분류</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>업무 유형</label>
              <select className="input" name="workType" defaultValue="">
                <option value="">없음</option>
                {WORK_TYPES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>현황</label>
              <select className="input" name="stage" defaultValue="">
                <option value="">없음</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>진행 상태</label>
              <select className="input" name="status" defaultValue="시작 전">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>종료 예정일</label>
              <input className="input" type="date" name="dueDate" />
            </div>
            <div className="field">
              <label>종료 예정일(범위 끝, 선택)</label>
              <input className="input" type="date" name="dueDateEnd" />
            </div>
          </div>
          <ManagerChips name="assignees" members={members} defaultValue={[]} />
          <div className="field">
            <label>내용</label>
            <textarea className="input" name="content" rows={3} />
          </div>
          {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "저장 중..." : "업무 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────── 히스토리 ─────────────────────────── */

function HistoryRow({ entry }: { entry: MarketingTaskHistoryEntry }) {
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
        style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}
      >
        <textarea className="input" name="content" required defaultValue={entry.content} rows={4} />
        {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
            취소
          </button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ borderBottom: "1px solid var(--color-divider)", padding: "var(--space-2) 0", fontSize: 13 }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "none",
          border: 0,
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <span style={{ minWidth: 0, flex: 1, whiteSpace: expanded ? "pre-wrap" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {expanded ? entry.content : firstLine}
          {!expanded && hasMore && <span className="text-muted"> …</span>}
        </span>
        <span className="text-muted" style={{ flex: "none", fontSize: 11 }}>
          {formatDateTime(entry.createdAt)}
        </span>
      </button>
      {expanded && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 11 }} className="text-muted">
          <span>
            {entry.authorEmail}
            {wasEdited && <span style={{ marginLeft: 4 }}>(수정됨)</span>}
          </span>
          {entry.isOwn && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: "2px 6px", minHeight: "auto" }}
            >
              수정
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HistorySection({ task }: { task: MarketingTask }) {
  const action = createMarketingTaskHistoryEntry.bind(null, task.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-5)", marginBottom: "var(--space-6)" }}>
      <h4 style={{ margin: "0 0 4px" }}>히스토리</h4>
      <p className="text-muted" style={{ margin: "0 0 var(--space-3)", fontSize: 12 }}>
        진행 상황·변경 사항을 시간순으로 남깁니다. 등록한 기록은 삭제할 수 없지만, 본인이 남긴 기록은 수정할 수 있습니다.
      </p>
      {task.history.length === 0 ? (
        <p style={{ fontSize: 13, marginBottom: "var(--space-3)" }}>아직 등록된 히스토리가 없습니다.</p>
      ) : (
        <div style={{ marginBottom: "var(--space-3)" }}>
          {task.history.map((h) => (
            <HistoryRow key={h.id} entry={h} />
          ))}
        </div>
      )}
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea className="input" name="content" required rows={3} placeholder="예: 시안 컨펌 완료, 인쇄 발주" />
        {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={pending}>
          {pending ? "등록 중..." : "히스토리 등록"}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────── 댓글 ─────────────────────────── */

function CommentsSection({ task }: { task: MarketingTask }) {
  const action = createMarketingTaskComment.bind(null, task.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [, startTransition] = useTransition();

  function handleDelete(commentId: string) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    startTransition(() => {
      void deleteMarketingTaskComment(commentId);
    });
  }

  return (
    <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-5)" }}>
      <h4 style={{ margin: "0 0 var(--space-3)" }}>댓글 {task.comments.length}개</h4>
      {task.comments.length === 0 ? (
        <p style={{ fontSize: 13 }}>아직 댓글이 없습니다. 의견을 남겨보세요.</p>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
          {task.comments.map((c) => (
            <div key={c.id} className="card blueprint" style={{ fontSize: 13 }}>
              <i className="corner tl" />
              <i className="corner tr" />
              <i className="corner bl" />
              <i className="corner br" />
              <div className="text-muted" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{c.authorEmail}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                  {formatDateTime(c.createdAt)}
                  {c.isOwn && (
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      style={{ background: "none", border: 0, padding: 0, color: "var(--color-accent-900)", cursor: "pointer", font: "inherit", fontSize: 11 }}
                    >
                      삭제
                    </button>
                  )}
                </span>
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{c.content}</div>
            </div>
          ))}
        </div>
      )}
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "var(--space-3)" }}>
        <textarea className="input" name="content" required rows={3} placeholder="의견을 남겨주세요" />
        {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={pending}>
          {pending ? "등록 중..." : "댓글 등록"}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────── 상세/수정 화면 ─────────────────────────── */

function TaskDetail({
  task,
  members,
  onClose,
}: {
  task: MarketingTask;
  members: string[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateMarketingTask, undefined);
  const wasPendingRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (wasPendingRef.current && !pending && !state?.error) onClose();
    wasPendingRef.current = pending;
  }, [pending, state, onClose]);

  function handleDelete() {
    if (!window.confirm("이 업무 항목을 삭제할까요?")) return;
    startTransition(() => {
      void deleteMarketingTask(task.id);
    });
    onClose();
  }

  return (
    <div>
      <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginBottom: "var(--space-4)", paddingInline: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        목록으로
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          background: "#ffffff",
          border: "1px solid var(--color-divider)",
          borderRadius: 8,
          boxShadow: "var(--shadow-sm)",
          padding: "var(--space-4)",
        }}
      >
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <input type="hidden" name="id" value={task.id} />
        <div className="field">
          <label>업무명 *</label>
          <input className="input" name="title" defaultValue={task.title} required />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          <div className="field">
            <label>분류</label>
            <select className="input" name="category" defaultValue={task.category ?? ""}>
              <option value="">미분류</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>업무 유형</label>
            <select className="input" name="workType" defaultValue={task.workType ?? ""}>
              <option value="">없음</option>
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>현황</label>
            <select className="input" name="stage" defaultValue={task.stage ?? ""}>
              <option value="">없음</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>진행 상태</label>
            <select className="input" name="status" defaultValue={task.status}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>종료 예정일</label>
            <input className="input" type="date" name="dueDate" defaultValue={toDateInputValue(task.dueDate)} />
          </div>
          <div className="field">
            <label>종료 예정일(범위 끝, 선택)</label>
            <input className="input" type="date" name="dueDateEnd" defaultValue={toDateInputValue(task.dueDateEnd)} />
          </div>
        </div>
        <ManagerChips name="assignees" members={members} defaultValue={task.assignees} />
        <div className="field">
          <label>내용</label>
          <textarea className="input" name="content" defaultValue={task.content ?? ""} rows={3} />
        </div>

        {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "저장 중..." : "수정 저장"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
        </div>
      </form>

      <button type="button" onClick={handleDelete} className="btn btn-secondary btn-danger" style={{ alignSelf: "flex-start" }}>
        이 업무 삭제
      </button>

      <HistorySection task={task} />
      <CommentsSection task={task} />
      </div>
    </div>
  );
}

/* ─────────────────────────── 칸반 카드 ─────────────────────────── */

function KanbanCard({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  task: MarketingTask;
  onOpen: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const [, startTransition] = useTransition();

  function handleCategoryChange(category: string) {
    startTransition(() => {
      void moveMarketingTaskCategory(task.id, category || null);
    });
  }

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className="kanban-card card elev-sm">
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-700)" strokeWidth="1.5" style={{ flex: "none" }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <span onClick={onOpen} style={{ cursor: "pointer" }} className="detail-link">
          {task.title}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <StatusTag status={task.status} />
        {task.workType && (
          <span className="text-muted" style={{ fontSize: 11 }}>
            {task.workType}
          </span>
        )}
      </div>
      <select
        className="input"
        value={task.category ?? ""}
        onChange={(e) => handleCategoryChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{
          fontSize: 10,
          minHeight: 20,
          padding: "1px 4px",
          marginTop: "var(--space-2)",
          background: "transparent",
          borderColor: "transparent",
          color: "var(--color-accent-700)",
        }}
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

/* ─────────────────────────── 메인 보드 ─────────────────────────── */

export function IndustryMarketingBoard({ tasks, members }: { tasks: MarketingTask[]; members: string[] }) {
  const [showArchived, setShowArchived] = useState(HARD_DEFAULTS.showArchived);
  const [view, setView] = useState<"kanban" | "list">(HARD_DEFAULTS.view);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const [, startTransition] = useTransition();

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = loadSavedDefaults();
    if (saved) {
      setShowArchived(saved.showArchived);
      setView(saved.view);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const editingTask = editingId ? (tasks.find((t) => t.id === editingId) ?? null) : null;

  const visible = useMemo(
    () => (showArchived ? tasks : tasks.filter((t) => !TERMINAL_STATUSES.has(t.status))),
    [tasks, showArchived]
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of STATUSES) m.set(s, 0);
    for (const t of tasks) m.set(t.status, (m.get(t.status) ?? 0) + 1);
    return m;
  }, [tasks]);

  const columns = useMemo(() => {
    const codeOf = (name: string) => name.slice(0, 1);
    const cols = CATEGORIES.map((name) => ({
      code: codeOf(name),
      name,
      label: name,
      items: visible.filter((t) => t.category === name),
    }));
    const unclassified = visible.filter((t) => !t.category);
    if (unclassified.length > 0) cols.push({ code: "-", name: "미분류", label: "미분류", items: unclassified });
    return cols;
  }, [visible]);

  function handleDragStart(e: DragEvent<HTMLDivElement>, id: string) {
    draggingIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    draggingIdRef.current = null;
    setDragOverCategory(null);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, category: string) {
    e.preventDefault();
    setDragOverCategory(null);
    const id = draggingIdRef.current;
    draggingIdRef.current = null;
    if (!id) return;
    startTransition(() => {
      void moveMarketingTaskCategory(id, category === "미분류" ? null : category);
    });
  }

  if (editingTask) {
    return (
      <div className="industry-theme" style={{ padding: "var(--space-8)", maxWidth: 1400, margin: "0 auto" }}>
        <TaskDetail task={editingTask} members={members} onClose={() => setEditingId(null)} />
      </div>
    );
  }

  return (
    <div className="industry-theme" style={{ minHeight: "100vh" }}>
      <TopSettingsBar showArchived={showArchived} onShowArchivedChange={setShowArchived} view={view} onViewChange={setView} />
      <div style={{ padding: "var(--space-8)", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>Marketing</h1>
      </div>
      <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
        XR사업부 마케팅 관련 업무를 관리 합니다.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "var(--space-6)",
          paddingBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-divider)",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 600, color: "var(--color-accent-800)" }}>
            {tasks.length}
          </span>
          <span className="text-muted" style={{ fontSize: 13, marginLeft: 6 }}>
            전체
          </span>
        </div>
        <div style={{ width: 1, height: 20, background: "var(--color-divider)" }} />
        {STATUSES.map((s) => (
          <div key={s}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 20,
                fontWeight: 600,
                color: s === "진행 중" ? "var(--color-accent-700)" : undefined,
              }}
            >
              {counts.get(s) ?? 0}
            </span>
            <span className="text-muted" style={{ fontSize: 13, marginLeft: 6 }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          background: "#ffffff",
          border: "1px solid var(--color-divider)",
          borderRadius: 8,
          boxShadow: "var(--shadow-sm)",
          padding: "var(--space-4)",
        }}
      >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
          />
          완료·종료 포함
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div className="seg">
            <button type="button" className={`seg-opt${view === "kanban" ? " active" : ""}`} onClick={() => setView("kanban")} style={{ border: 0 }}>
              목록
            </button>
            <button type="button" className={`seg-opt${view === "list" ? " active" : ""}`} onClick={() => setView("list")} style={{ border: 0 }}>
              리스트
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setShowAddDialog(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            새 업무 추가
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
            columnGap: "var(--space-6)",
            rowGap: "var(--space-5)",
            alignItems: "start",
            overflowX: "auto",
          }}
        >
          {columns.map((col) => (
            <div
              key={col.name}
              className={`col-drop${dragOverCategory === col.name ? " drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCategory(col.name);
              }}
              onDragLeave={() => setDragOverCategory((cur) => (cur === col.name ? null : cur))}
              onDrop={(e) => handleDrop(e, col.name)}
              style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minHeight: 80, minWidth: 160 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingBottom: "var(--space-3)",
                  borderBottom: "1px solid var(--color-divider)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    flex: "none",
                    background: "var(--color-accent-900)",
                    color: "var(--color-bg)",
                    fontFamily: "var(--font-heading)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {col.code}
                </span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, flex: 1 }}>{col.label}</span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15, color: "var(--color-accent-700)" }}>
                  {col.items.length}
                </span>
              </div>
              {col.items.map((t) => (
                <KanbanCard
                  key={t.id}
                  task={t}
                  onOpen={() => setEditingId(t.id)}
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
              {col.items.length === 0 && (
                <div
                  className="text-muted"
                  style={{
                    fontSize: 12,
                    padding: "var(--space-4) 0",
                    textAlign: "center",
                    border: "1px dashed var(--color-divider)",
                    borderRadius: 8,
                  }}
                >
                  없음
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>업무명</th>
                <th>분류</th>
                <th>상태</th>
                <th>현황</th>
                <th>종료 예정일</th>
                <th>담당자</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} onClick={() => setEditingId(t.id)} style={{ cursor: "pointer" }}>
                  <td style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} className="detail-link">
                      {t.title}
                    </span>
                  </td>
                  <td>{t.category ?? "미분류"}</td>
                  <td>
                    <StatusTag status={t.status} />
                  </td>
                  <td>{t.stage ?? "-"}</td>
                  <td>{formatDate(t.dueDate) ?? "-"}</td>
                  <td>{t.assignees.join(", ") || "-"}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-6)" }} className="text-muted">
                    조건에 맞는 업무가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {showAddDialog && <AddTaskDialog members={members} onClose={() => setShowAddDialog(false)} />}
      </div>
    </div>
  );
}
