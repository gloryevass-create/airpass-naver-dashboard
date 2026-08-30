"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// components/dashboard/MonitorDateRangeFilter.tsx와 로직은 동일하지만(기간 이동·조회),
// 그건 Industry 테마(.industry-theme) 클래스에 기대는 컴포넌트라 이 화면들(조달입찰공고/
// 사전규격/교육뉴스, 전부 일반 Tailwind 페이지)에서 쓰면 .card/.btn/.input 등이 전혀
// 스타일링되지 않은 채로 보였다 — 그래서 이 세 화면 전용으로 일반 Tailwind 토큰만 쓰는
// 별도 컴포넌트를 새로 만들었다(2026-08-30, 사용자 확인: 박스형 디자인 + 한 줄 배치 요청).
function Spinner() {
  return <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function spanDays(since: string, until: string) {
  const ms = new Date(`${until}T00:00:00Z`).getTime() - new Date(`${since}T00:00:00Z`).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

export function NewsDateRangeFilter({
  basePath,
  range,
  resultCount,
}: {
  basePath: string;
  range: { since: string; until: string };
  resultCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"prev" | "next" | "apply" | null>(null);
  const [since, setSince] = useState(range.since);
  const [until, setUntil] = useState(range.until);

  function applyRange(newSince: string, newUntil: string, action: "prev" | "next" | "apply" = "apply") {
    setPendingAction(action);
    const params = new URLSearchParams({ from: newSince, to: newUntil });
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function shift(direction: -1 | 1) {
    const days = spanDays(since, until);
    const newSince = addDays(since, direction * days);
    const newUntil = addDays(until, direction * days);
    setSince(newSince);
    setUntil(newUntil);
    applyRange(newSince, newUntil, direction === -1 ? "prev" : "next");
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={isPending}
          aria-label="이전 기간"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline text-ink-mute hover:bg-canvas-cream disabled:opacity-50"
        >
          {isPending && pendingAction === "prev" ? <Spinner /> : "◀"}
        </button>
        <input
          type="date"
          value={since}
          max={until}
          disabled={isPending}
          onChange={(e) => setSince(e.target.value)}
          className="rounded-md border border-hairline px-2 py-1.5 text-sm text-ink outline-none focus:border-primary disabled:opacity-50"
        />
        <span className="text-ink-mute">→</span>
        <input
          type="date"
          value={until}
          min={since}
          disabled={isPending}
          onChange={(e) => setUntil(e.target.value)}
          className="rounded-md border border-hairline px-2 py-1.5 text-sm text-ink outline-none focus:border-primary disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={isPending}
          aria-label="다음 기간"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-hairline text-ink-mute hover:bg-canvas-cream disabled:opacity-50"
        >
          {isPending && pendingAction === "next" ? <Spinner /> : "▶"}
        </button>
        <button
          type="button"
          onClick={() => applyRange(since, until, "apply")}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {isPending && pendingAction === "apply" && <Spinner />}
          {isPending && pendingAction === "apply" ? "조회 중..." : "조회"}
        </button>
      </div>
      <div className="hidden h-6 w-px shrink-0 bg-hairline sm:block" />
      <p className="whitespace-nowrap text-xs text-ink-mute">
        조회 결과{" "}
        <span className="font-semibold text-ink">
          {range.since} ~ {range.until}
        </span>{" "}
        · <span className="font-semibold text-primary">{resultCount.toLocaleString("ko-KR")}건</span>
      </p>
    </div>
  );
}
