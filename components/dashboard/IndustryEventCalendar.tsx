"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamEventV2 } from "@/lib/queries/eventsV2";
import { createTeamEventV2, updateTeamEventV2, deleteTeamEventV2 } from "@/app/dashboard/actions/eventsV2";

// 태그별 점 색상 — 기존 Tailwind 버전(TeamEventCalendarV2.tsx)의 TAG_COLORS와
// 같은 태그 이름을 매핑하되, 이 목업은 색이 있는 알약이 아니라 작은 점 하나로
// 분류를 표시하는 방식이라 실제 hex 값으로 바꿨다(사용자 확인, 2026-08-29 —
// 태그 종류가 많아 디자인 원본의 고정 4분류로 줄이면 정보가 손실되므로 기존
// 태그 색 구분은 그대로 유지).
const TAG_DOT_COLORS: Record<string, string> = {
  회식: "#ec4899",
  미팅: "#eab308",
  행사: "#3b82f6",
  휴일: "#ef4444",
  체험: "#22c55e",
  교육: "#22c55e",
  제안: "#6b7280",
  박람회: "#a855f7",
  휴무: "#f97316",
  외근: "#f59e0b",
  마감: "#525252",
  쇼룸: "#eab308",
  세미나: "#6b7280",
  "공사&설치": "#16a34a",
};
const DEFAULT_DOT_COLOR = "var(--color-accent-600)";

function tagDotColor(tag: string | undefined): string {
  if (!tag) return DEFAULT_DOT_COLOR;
  return TAG_DOT_COLORS[tag] ?? DEFAULT_DOT_COLOR;
}

function toKstDateStr(iso: string) {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

function addDaysToDateStr(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function startOfWeek(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0=월
  return addDaysToDateStr(day, -wd);
}

function shiftMonthKeepDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  let month = m - 1 + delta;
  let year = y;
  while (month < 0) {
    month += 12;
    year -= 1;
  }
  while (month > 11) {
    month -= 12;
    year += 1;
  }
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

function buildMonthGrid(month: string): string[][] {
  const [y, m] = month.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(y, m - 1, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(y, m - 1, 1 - firstWeekday));

  const weeks: string[][] = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor.toISOString().slice(0, 10));
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
    weeks.push(week);
    if (w >= 4 && Number(week[6].slice(5, 7)) !== m) break;
  }
  return weeks;
}

function eventsOnDay(events: TeamEventV2[], day: string): TeamEventV2[] {
  return events.filter((e) => {
    const start = toKstDateStr(e.dateStart);
    const end = e.dateEnd ? toKstDateStr(e.dateEnd) : start;
    return day >= start && day <= end;
  });
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

/** 담당자/참석자 다중 선택 — Tailwind 톤의 MemberMultiSelect 대신 Industry
 * 테마의 알약형 태그(.tag-chip)로 새로 그렸다(IndustryBusinessBoard.tsx의
 * ManagerChips와 동일한 이유 — 색이 섞이면 이 페이지만의 통일된 룩이 깨짐). */
function MemberChips({ name, label, members, defaultValue }: { name: string; label: string; members: string[]; defaultValue: string[] }) {
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
      <label>{label}</label>
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

/* ─────────────────────────── 일정 추가/수정 다이얼로그 ─────────────────────────── */

function EventDialog({
  event,
  defaultDate,
  members,
  onClose,
}: {
  event: TeamEventV2 | null;
  defaultDate: string | null;
  members: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const action = event ? updateTeamEventV2 : createTeamEventV2;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [, startTransition] = useTransition();
  const wasPendingRef = useRef(false);

  // useActionState의 dispatch는 서버 액션 결과를 그 자리에서 돌려주지 않는다 —
  // pending이 true→false로 바뀌는 순간 에러가 없을 때만 닫는다(이 세션에서
  // 반복적으로 고친 패턴 재사용, 2026-08-29).
  useEffect(() => {
    if (wasPendingRef.current && !pending && !state?.error) {
      router.refresh();
      onClose();
    }
    wasPendingRef.current = pending;
  }, [pending, state, onClose, router]);

  function handleDelete() {
    if (!event) return;
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteTeamEventV2(event.id);
      router.refresh();
      onClose();
    });
  }

  const defaultStart = event ? toDatetimeLocalValue(event.dateStart) : defaultDate ? `${defaultDate}T09:00` : "";

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" style={{ width: "min(560px,100%)", maxHeight: "88vh", overflowY: "auto", background: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="17" rx="0" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="7" y1="2" x2="7" y2="5" />
            <line x1="17" y1="2" x2="17" y2="5" />
          </svg>
          {event ? "일정 수정" : "새 일정 추가"}
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {event && <input type="hidden" name="id" value={event.id} />}
          <div className="field">
            <label>제목 *</label>
            <input className="input" name="title" defaultValue={event?.title ?? ""} required placeholder="일정 제목" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="field">
              <label>시작일시 *</label>
              <input className="input" name="dateStart" type="datetime-local" defaultValue={defaultStart} required />
            </div>
            <div className="field">
              <label>종료일시</label>
              <input className="input" name="dateEnd" type="datetime-local" defaultValue={toDatetimeLocalValue(event?.dateEnd ?? null)} />
            </div>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" name="isDatetime" defaultChecked={event?.isDatetime ?? true} style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }} />
            시간까지 정확함(끄면 날짜만 있는 일정으로 표시)
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="field">
              <label>태그(쉼표로 구분)</label>
              <input className="input" name="tags" defaultValue={event?.tags.join(", ") ?? ""} placeholder="예: 미팅, 외근" />
            </div>
            <div className="field">
              <label>분류</label>
              <input className="input" name="category" defaultValue={event?.category ?? ""} />
            </div>
            <div className="field">
              <label>장소</label>
              <input className="input" name="location" defaultValue={event?.location ?? ""} />
            </div>
            <div className="field">
              <label>대상</label>
              <input className="input" name="target" defaultValue={event?.target ?? ""} />
            </div>
          </div>
          <MemberChips name="assignees" label="담당자" members={members} defaultValue={event?.assignees ?? []} />
          <MemberChips name="attendees" label="참석자" members={members} defaultValue={event?.attendees ?? []} />
          <div className="field">
            <label>내용</label>
            <textarea className="input" name="content" defaultValue={event?.content ?? ""} rows={3} />
          </div>
          {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
          <div className="dialog-actions">
            {event && (
              <button type="button" onClick={handleDelete} className="btn btn-secondary btn-danger" style={{ marginRight: "auto" }}>
                삭제
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────── 이벤트 알약(점 + 제목) ─────────────────────────── */

function EventPill({ event, onClick, big }: { event: TeamEventV2; onClick: () => void; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        font: "inherit",
        fontSize: big ? 14 : 11.5,
        padding: big ? "6px 0" : "1px 0",
        color: "var(--color-text)",
        overflow: "hidden",
      }}
    >
      <span style={{ flex: "none", width: 6, height: 6, borderRadius: "50%", background: tagDotColor(event.tags[0]) }} />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.title}</span>
    </button>
  );
}

/* ─────────────────────────── 메인 캘린더 ─────────────────────────── */

export function IndustryEventCalendar({
  events,
  month,
  initialCursor,
  members,
}: {
  events: TeamEventV2[];
  month: string;
  initialCursor: string;
  members: string[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(initialCursor);
  const [editing, setEditing] = useState<TeamEventV2 | "new" | null>(null);
  const [newEventDate, setNewEventDate] = useState<string | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);

  // 커서가 현재 서버에서 불러온 달(month)을 벗어나면(주/일 보기에서 달 경계를
  // 넘어가는 경우 포함) 그 달의 데이터를 새로 불러와야 한다 — URL의 month·day를
  // 갱신해 서버 컴포넌트가 다시 조회하게 한다(기존 EventMonthNav와 같은 방식).
  function navigateTo(newCursor: string) {
    const newMonth = newCursor.slice(0, 7);
    if (newMonth === month) {
      setCursor(newCursor);
      return;
    }
    router.push(`/dashboard/events2?month=${newMonth}&day=${newCursor}`);
  }

  function prevPeriod() {
    navigateTo(view === "month" ? shiftMonthKeepDay(cursor, -1) : view === "week" ? addDaysToDateStr(cursor, -7) : addDaysToDateStr(cursor, -1));
  }
  function nextPeriod() {
    navigateTo(view === "month" ? shiftMonthKeepDay(cursor, 1) : view === "week" ? addDaysToDateStr(cursor, 7) : addDaysToDateStr(cursor, 1));
  }
  function goToday() {
    navigateTo(todayStr);
  }

  function openAdd(day?: string) {
    setNewEventDate(day ?? cursor);
    setEditing("new");
  }
  function closeDialog() {
    setEditing(null);
    setNewEventDate(null);
  }

  const [cy, cm, cd] = cursor.split("-").map(Number);
  const cursorDate = new Date(Date.UTC(cy, cm - 1, cd));

  let periodLabel = "";
  if (view === "month") {
    periodLabel = `${cy}년 ${cm}월`;
  } else if (view === "week") {
    const start = startOfWeek(cursor);
    const end = addDaysToDateStr(start, 6);
    const [, sm, sd] = start.split("-").map(Number);
    const [, em, ed] = end.split("-").map(Number);
    periodLabel = `${sm}월 ${sd}일 - ${em}월 ${ed}일`;
  } else {
    periodLabel = `${cy}년 ${cm}월 ${cd}일 (${WEEKDAYS[(cursorDate.getUTCDay() + 6) % 7]})`;
  }

  const weeks = view === "month" ? buildMonthGrid(month) : [];
  const weekDays = view === "week" ? Array.from({ length: 7 }, (_, i) => addDaysToDateStr(startOfWeek(cursor), i)) : [];
  const dayEvents = view === "day" ? eventsOnDay(events, cursor) : [];

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8)", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="17" rx="0" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="7" y1="2" x2="7" y2="5" />
          <line x1="17" y1="2" x2="17" y2="5" />
        </svg>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>Calendar</h1>
      </div>
      <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 14 }}>
        이 화면에서 직접 일정을 추가·수정·삭제합니다(Notion 연동 없음 — 이 시스템이 원본입니다).
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary btn-icon" onClick={prevPeriod} aria-label="이전">
            ←
          </button>
          <h2 style={{ minWidth: 190, textAlign: "center", margin: 0, fontSize: 24, fontFamily: "var(--font-heading)" }}>{periodLabel}</h2>
          <button type="button" className="btn btn-secondary btn-icon" onClick={nextPeriod} aria-label="다음">
            →
          </button>
          <button type="button" className="btn btn-secondary" onClick={goToday} style={{ marginLeft: "var(--space-2)" }}>
            오늘
          </button>
          <div className="seg" style={{ marginLeft: "var(--space-3)" }}>
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`seg-opt${view === v ? " active" : ""}`}
                onClick={() => setView(v)}
                style={{ border: 0 }}
              >
                {v === "month" ? "월" : v === "week" ? "주" : "일"}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openAdd()}>
          + 새 일정 추가
        </button>
      </div>

      {view === "month" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 1 }}>
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                style={{
                  padding: "var(--space-2)",
                  fontFamily: "var(--font-heading)",
                  fontSize: 12,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: i === 6 ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                  textAlign: "center",
                }}
              >
                {wd}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 1 }}>
              {week.map((day) => {
                const inMonth = day.slice(0, 7) === month;
                const dayEvts = eventsOnDay(events, day);
                const isToday = day === todayStr;
                const MAX = 3;
                return (
                  <div
                    key={day}
                    className="day-card"
                    style={{
                      height: 112,
                      padding: "var(--space-2)",
                      background: "#ffffff",
                      border: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      overflow: "hidden",
                      opacity: inMonth ? 1 : 0.35,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: 14,
                          lineHeight: 1,
                          color: isToday ? "var(--color-accent-700)" : undefined,
                          fontWeight: isToday ? 600 : 400,
                        }}
                      >
                        {Number(day.slice(8, 10))}
                      </span>
                      <button
                        type="button"
                        onClick={() => openAdd(day)}
                        className="btn btn-ghost btn-icon"
                        style={{ width: 18, height: 18, fontSize: 13, opacity: 0.3, minHeight: "auto" }}
                        title="이 날짜에 일정 추가"
                      >
                        +
                      </button>
                    </div>
                    {dayEvts.slice(0, MAX).map((ev) => (
                      <EventPill key={ev.id} event={ev} onClick={() => setEditing(ev)} />
                    ))}
                    {dayEvts.length > MAX && (
                      <span style={{ fontSize: 11, color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}>
                        +{dayEvts.length - MAX}개 더보기
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {view === "week" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
          {weekDays.map((day, i) => {
            const dayEvts = eventsOnDay(events, day);
            const isToday = day === todayStr;
            return (
              <div
                key={day}
                style={{
                  minHeight: 420,
                  padding: "var(--space-2)",
                  background: "#ffffff",
                  border: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingBottom: "var(--space-2)",
                    borderBottom: "1px solid color-mix(in srgb, var(--color-text) 10%, transparent)",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      fontFamily: "var(--font-heading)",
                      color: i === 6 ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 60%, transparent)",
                    }}
                  >
                    {WEEKDAYS[i]}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: 14,
                      color: isToday ? "var(--color-accent-700)" : undefined,
                      fontWeight: isToday ? 600 : 400,
                    }}
                  >
                    {Number(day.slice(8, 10))}
                  </span>
                </div>
                {dayEvts.map((ev) => (
                  <EventPill key={ev.id} event={ev} onClick={() => setEditing(ev)} />
                ))}
                <button
                  type="button"
                  onClick={() => openAdd(day)}
                  className="btn btn-ghost"
                  style={{ marginTop: "var(--space-2)", fontSize: 12, opacity: 0.5, alignSelf: "flex-start" }}
                >
                  + 추가
                </button>
              </div>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <div
          className="day-card"
          style={{
            maxWidth: 640,
            padding: "var(--space-4)",
            background: "#ffffff",
            border: "1px solid color-mix(in srgb, var(--color-text) 8%, transparent)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {dayEvents.map((ev) => (
            <EventPill key={ev.id} event={ev} onClick={() => setEditing(ev)} big />
          ))}
          {dayEvents.length === 0 && (
            <p className="text-muted" style={{ fontSize: 13, margin: "var(--space-2) 0" }}>
              일정이 없습니다.
            </p>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => openAdd(cursor)} style={{ marginTop: "var(--space-3)", alignSelf: "flex-start" }}>
            + 이 날짜에 일정 추가
          </button>
        </div>
      )}

      {editing && (
        <EventDialog
          event={editing === "new" ? null : editing}
          defaultDate={newEventDate}
          members={members}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
