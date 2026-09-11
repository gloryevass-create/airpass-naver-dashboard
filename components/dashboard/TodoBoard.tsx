"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Todo, TodoPriority } from "@/lib/queries/todos";
import { createTodo, updateTodo, deleteTodo, toggleTodoComplete, savePushSubscription } from "@/app/dashboard/actions/todos";

const PRIORITY_LABEL: Record<TodoPriority, string> = { high: "높음", medium: "보통", low: "낮음" };
const PRIORITY_COLOR: Record<TodoPriority, string> = {
  high: "var(--color-accent-700)",
  medium: "var(--color-accent-500, var(--color-accent))",
  low: "var(--color-ink-mute, #8a94a6)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function formatDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer;
}

function NotificationSetupBanner() {
  const [status, setStatus] = useState<"idle" | "unsupported" | "denied" | "granted" | "loading">("idle");

  // 알림 지원 여부·권한 상태는 브라우저에서만 읽을 수 있어(Notification API)
  // 마운트 후에 반영한다 — 서버 렌더링 HTML과 클라이언트 초기값이 달라지는
  // 하이드레이션 경고를 피하기 위함(IndustryEventCalendar.tsx와 동일한 패턴).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission === "granted" ? "granted" : "idle");
  }, []);

  async function enableNotifications() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setStatus("unsupported");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const json = subscription.toJSON();
      await savePushSubscription({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      });
      setStatus("granted");
    } catch {
      setStatus("denied");
    }
  }

  if (status === "granted" || status === "unsupported") return null;

  return (
    <div
      className="card blueprint"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
        padding: "var(--space-4) var(--space-5)",
        marginBottom: "var(--space-4)",
        background: "#fff",
      }}
    >
      <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
        {status === "denied"
          ? "브라우저 알림 권한이 꺼져 있어 할 일 알람을 받을 수 없습니다. 브라우저 설정에서 알림을 허용해주세요."
          : "할 일 알람을 브라우저 알림으로 받으려면 알림 권한을 허용해주세요."}
      </p>
      {status !== "denied" && (
        <button type="button" className="btn btn-primary blueprint" onClick={enableNotifications} disabled={status === "loading"}>
          {status === "loading" ? "설정 중..." : "알림 허용"}
        </button>
      )}
    </div>
  );
}

function TodoForm({ todo, onDone }: { todo: Todo | null; onDone: (saved: boolean) => void }) {
  const action = todo ? updateTodo.bind(null, todo.id) : createTodo;
  const [state, formAction, pending] = useActionState(action, undefined);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !pending && !state?.error) onDone(true);
    wasPendingRef.current = pending;
  }, [pending, state, onDone]);

  return (
    <div className="card blueprint elev-md" style={{ marginBottom: "var(--space-4)", padding: "var(--space-5) var(--space-6)", background: "#ffffff" }}>
      <div className="card-kicker">{todo ? "할 일 수정" : "새 할 일 등록"}</div>
      <form action={formAction} style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="field">
          <label>제목 *</label>
          <input className="input" name="title" required maxLength={200} defaultValue={todo?.title ?? ""} placeholder="예: 산출내역 발송" />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: "1 1 160px" }}>
            <label>기한</label>
            <input className="input" type="date" name="dueDate" defaultValue={todo?.dueDate ?? ""} />
          </div>
          <div className="field" style={{ flex: "1 1 160px" }}>
            <label>우선순위</label>
            <select className="input" name="priority" defaultValue={todo?.priority ?? "medium"}>
              <option value="high">높음</option>
              <option value="medium">보통</option>
              <option value="low">낮음</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>알람 (선택)</label>
          <input className="input" type="datetime-local" name="alarmAt" defaultValue={formatDateTimeLocal(todo?.alarmAt ?? null)} />
        </div>
        {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button type="submit" className="btn btn-primary blueprint" disabled={pending}>
            {pending ? "저장 중..." : todo ? "수정 저장" : "등록"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onDone(false)}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

function TodoRow({ todo, onEdit }: { todo: Todo; onEdit: () => void }) {
  const [, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      void toggleTodoComplete(todo.id, !todo.isCompleted);
    });
  }

  function handleDelete() {
    if (!window.confirm("이 할 일을 삭제하시겠습니까?")) return;
    startTransition(() => {
      void deleteTodo(todo.id);
    });
  }

  const isOverdue = !todo.isCompleted && todo.dueDate && new Date(todo.dueDate) < new Date(new Date().toDateString());

  return (
    <div
      className="card blueprint elev-sm"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-3)",
        padding: "var(--space-4) var(--space-5)",
        background: "#ffffff",
        opacity: todo.isCompleted ? 0.6 : 1,
      }}
    >
      <input type="checkbox" checked={todo.isCompleted} onChange={handleToggle} style={{ marginTop: 4, width: 16, height: 16, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: todo.isCompleted ? "line-through" : "none",
            }}
          >
            {todo.title}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[todo.priority] }}>{PRIORITY_LABEL[todo.priority]}</span>
          {todo.alarmAt && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          )}
        </div>
        <p className="text-muted" style={{ fontSize: 12, margin: "4px 0 0" }}>
          {todo.dueDate ? (
            <span style={{ color: isOverdue ? "var(--color-accent-900)" : undefined }}>기한 {formatDate(todo.dueDate)}</span>
          ) : (
            "기한 없음"
          )}
        </p>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: "2px 6px", minHeight: "auto" }} onClick={onEdit}>
          수정
        </button>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: "2px 6px", minHeight: "auto" }} onClick={handleDelete}>
          삭제
        </button>
      </div>
    </div>
  );
}

export function TodoBoard({ todos }: { todos: Todo[] }) {
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const editingTodo = editingId && editingId !== "new" ? (todos.find((t) => t.id === editingId) ?? null) : null;
  const [showCompleted, setShowCompleted] = useState(false);

  const { pending, done } = useMemo(
    () => ({ pending: todos.filter((t) => !t.isCompleted), done: todos.filter((t) => t.isCompleted) }),
    [todos]
  );

  return (
    <div className="industry-theme" style={{ minHeight: "100vh" }}>
      <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>할 일</h1>
          </div>
          <button type="button" className="btn btn-primary blueprint" onClick={() => setEditingId("new")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            새 할 일 등록
          </button>
        </div>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
          나만 보는 개인 할 일 목록입니다. 기한·우선순위를 정하고, 필요하면 알람을 설정하세요.
        </p>

        <NotificationSetupBanner />

        {editingId === "new" && <TodoForm todo={null} onDone={() => setEditingId(null)} />}
        {editingTodo && <TodoForm todo={editingTodo} onDone={() => setEditingId(null)} />}

        {pending.length === 0 ? (
          <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
            <p className="text-muted" style={{ margin: 0 }}>미완료 할 일이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {pending.map((t) => (
              <TodoRow key={t.id} todo={t} onEdit={() => setEditingId(t.id)} />
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div style={{ marginTop: "var(--space-6)" }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
              onClick={() => setShowCompleted((v) => !v)}
            >
              완료된 할 일 {done.length}개 {showCompleted ? "접기" : "펼치기"}
            </button>
            {showCompleted && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                {done.map((t) => (
                  <TodoRow key={t.id} todo={t} onEdit={() => setEditingId(t.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
