"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamEventV2 } from "@/lib/queries/eventsV2";
import {
  createTeamEventV2,
  updateTeamEventV2,
  deleteTeamEventV2,
} from "@/app/dashboard/actions/eventsV2";
import { MemberMultiSelect } from "@/components/dashboard/MemberMultiSelect";
import { EventMonthNav } from "@/components/dashboard/EventMonthNav";

const TAG_COLORS: Record<string, string> = {
  회식: "bg-pink-100 text-pink-800",
  미팅: "bg-yellow-100 text-yellow-800",
  행사: "bg-blue-100 text-blue-800",
  휴일: "bg-red-100 text-red-800",
  체험: "bg-green-100 text-green-800",
  교육: "bg-green-100 text-green-800",
  제안: "bg-gray-100 text-gray-800",
  박람회: "bg-purple-100 text-purple-800",
  휴무: "bg-orange-100 text-orange-800",
  외근: "bg-amber-100 text-amber-800",
  마감: "bg-neutral-200 text-neutral-800",
  쇼룸: "bg-yellow-100 text-yellow-800",
  세미나: "bg-gray-100 text-gray-800",
  "공사&설치": "bg-green-100 text-green-800",
};

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? "bg-canvas-lavender text-primary";
}

function toKstDateStr(iso: string) {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// datetime-local input은 타임존 없는 "YYYY-MM-DDTHH:mm"을 주고받는다 — 브라우저의
// OS 타임존 설정에 기대지 않고, 이 앱의 고정 기준인 KST(UTC+9)로 항상 명시적으로
// 변환한다(저장 시 서버 쪽 kstLocalToIso와 짝을 이룬다).
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16);
}

function buildMonthGrid(month: string): string[][] {
  const [y, m] = month.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(y, m - 1, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // 0=월
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

function EventForm({
  event,
  defaultDate,
  members,
  onDone,
}: {
  event: TeamEventV2 | null;
  defaultDate: string | null;
  members: string[];
  onDone: () => void;
}) {
  const router = useRouter();
  const action = event ? updateTeamEventV2 : createTeamEventV2;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [, startTransition] = useTransition();

  function handleDelete() {
    if (!event) return;
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteTeamEventV2(event.id);
      router.refresh();
      onDone();
    });
  }

  const defaultStart = event
    ? toDatetimeLocalValue(event.dateStart)
    : defaultDate
      ? `${defaultDate}T09:00`
      : "";

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        router.refresh();
        onDone();
      }}
      className="flex flex-col gap-3"
    >
      {event && <input type="hidden" name="id" value={event.id} />}
      <label className="flex flex-col gap-1 text-xs text-ink-mute">
        제목 *
        <input
          name="title"
          defaultValue={event?.title ?? ""}
          required
          className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          시작일시 *
          <input
            name="dateStart"
            type="datetime-local"
            defaultValue={defaultStart}
            required
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          종료일시
          <input
            name="dateEnd"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(event?.dateEnd ?? null)}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs text-ink-mute">
        <input type="checkbox" name="isDatetime" defaultChecked={event?.isDatetime ?? true} />
        시간까지 정확함(끄면 날짜만 있는 일정으로 표시)
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          태그(쉼표로 구분)
          <input
            name="tags"
            defaultValue={event?.tags.join(", ") ?? ""}
            placeholder="예: 미팅, 외근"
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          분류
          <input
            name="category"
            defaultValue={event?.category ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          장소
          <input
            name="location"
            defaultValue={event?.location ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          대상
          <input
            name="target"
            defaultValue={event?.target ?? ""}
            className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <MemberMultiSelect name="assignees" label="담당자" members={members} defaultValue={event?.assignees ?? []} />
        <MemberMultiSelect name="attendees" label="참석자" members={members} defaultValue={event?.attendees ?? []} />
      </div>
      <label className="flex flex-col gap-1 text-xs text-ink-mute">
        내용
        <textarea
          name="content"
          defaultValue={event?.content ?? ""}
          rows={3}
          className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
        />
      </label>
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
          >
            {pending ? "저장 중..." : event ? "수정 저장" : "일정 추가"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
          >
            취소
          </button>
        </div>
        {event && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
          >
            삭제
          </button>
        )}
      </div>
    </form>
  );
}

export function TeamEventCalendarV2({
  events,
  month,
  members,
}: {
  events: TeamEventV2[];
  month: string;
  members: string[];
}) {
  const [editing, setEditing] = useState<TeamEventV2 | "new" | null>(null);
  const [newEventDate, setNewEventDate] = useState<string | null>(null);
  const weeks = buildMonthGrid(month);

  function openNew(day: string) {
    setNewEventDate(day);
    setEditing("new");
  }

  function close() {
    setEditing(null);
    setNewEventDate(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <EventMonthNav basePath="/dashboard/events2" month={month} />
        <button
          type="button"
          onClick={() => openNew(new Date().toISOString().slice(0, 10))}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          + 새 일정 추가
        </button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-hairline bg-canvas-cream">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-b border-hairline bg-canvas-cream text-xs font-bold text-ink-mute">
            {WEEKDAYS.map((w) => (
              <div key={w} className={`px-2 py-2 text-center ${w === "일" ? "text-semantic-error" : ""}`}>
                {w}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-hairline last:border-b-0">
              {week.map((day) => {
                const inMonth = day.slice(0, 7) === month;
                const dayEvents = eventsOnDay(events, day);
                const isToday = day === new Date().toISOString().slice(0, 10);
                return (
                  <div
                    key={day}
                    className={`group min-h-24 border-r border-hairline p-1 last:border-r-0 ${
                      inMonth ? "" : "bg-[#f7f8fb]"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div
                        className={`text-xs ${
                          isToday
                            ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-white"
                            : inMonth
                              ? "text-ink-mute"
                              : "text-ink-mute/40"
                        }`}
                      >
                        {Number(day.slice(8, 10))}
                      </div>
                      <button
                        type="button"
                        onClick={() => openNew(day)}
                        className="hidden text-xs text-ink-mute hover:text-primary group-hover:block"
                        title="이 날짜에 일정 추가"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setEditing(ev)}
                          className="truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight hover:opacity-80"
                          title={ev.title}
                        >
                          <span
                            className={`mr-1 inline-block rounded px-1 ${
                              ev.tags[0] ? tagColor(ev.tags[0]) : "bg-canvas-lavender text-primary"
                            }`}
                          >
                            {ev.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={close}>
          <div
            className="w-full max-w-md rounded-sm border border-hairline bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-bold text-ink">{editing === "new" ? "새 일정" : "일정 수정"}</h3>
            <EventForm
              event={editing === "new" ? null : editing}
              defaultDate={newEventDate}
              members={members}
              onDone={close}
            />
          </div>
        </div>
      )}
    </div>
  );
}
