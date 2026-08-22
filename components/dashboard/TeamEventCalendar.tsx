"use client";

import { useState } from "react";
import type { TeamEvent } from "@/lib/queries/events";

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

function eventsOnDay(events: TeamEvent[], day: string): TeamEvent[] {
  return events.filter((e) => {
    const start = toKstDateStr(e.dateStart);
    const end = e.dateEnd ? toKstDateStr(e.dateEnd) : start;
    return day >= start && day <= end;
  });
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function TeamEventCalendar({ events, month }: { events: TeamEvent[]; month: string }) {
  const [selected, setSelected] = useState<TeamEvent | null>(null);
  const weeks = buildMonthGrid(month);

  return (
    <div className="overflow-x-auto rounded-sm border border-hairline bg-canvas-cream">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 border-b border-hairline bg-canvas-cream text-xs font-semibold text-ink-mute">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center">
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
                  className={`min-h-24 border-r border-hairline p-1 last:border-r-0 ${
                    inMonth ? "" : "bg-black/10"
                  }`}
                >
                  <div
                    className={`mb-1 text-xs ${
                      isToday
                        ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-white"
                        : inMonth
                          ? "text-ink-mute"
                          : "text-ink-mute/40"
                    }`}
                  >
                    {Number(day.slice(8, 10))}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelected(ev)}
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

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-sm border border-hairline bg-background p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex flex-wrap gap-1">
              {selected.tags.map((t) => (
                <span key={t} className={`rounded-full px-2 py-0.5 text-xs ${tagColor(t)}`}>
                  {t}
                </span>
              ))}
            </div>
            <h3 className="mb-2 text-lg font-bold text-ink">{selected.title}</h3>
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-ink-mute">일시</dt>
                <dd className="text-ink">
                  {toKstDateStr(selected.dateStart)}
                  {selected.dateEnd && selected.dateEnd !== selected.dateStart
                    ? ` ~ ${toKstDateStr(selected.dateEnd)}`
                    : ""}
                </dd>
              </div>
              {selected.location && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-ink-mute">장소</dt>
                  <dd className="text-ink">{selected.location}</dd>
                </div>
              )}
              {selected.category && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-ink-mute">분류</dt>
                  <dd className="text-ink">{selected.category}</dd>
                </div>
              )}
              {selected.target && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-ink-mute">대상</dt>
                  <dd className="text-ink">{selected.target}</dd>
                </div>
              )}
              {selected.content && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-ink-mute">내용</dt>
                  <dd className="whitespace-pre-wrap text-ink">{selected.content}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex justify-between">
              <a
                href={selected.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-link-blue hover:underline"
              >
                Notion에서 열기 →
              </a>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-hairline px-4 py-1.5 text-sm font-medium text-ink hover:bg-canvas-cream"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
