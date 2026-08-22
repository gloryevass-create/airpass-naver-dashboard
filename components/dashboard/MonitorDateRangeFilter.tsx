"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 ${
        dark ? "border-ink-mute/30 border-t-ink" : "border-white/40 border-t-white"
      }`}
    />
  );
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

export function MonitorDateRangeFilter({
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
    <div className="rounded-sm border border-hairline p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={isPending}
          aria-label="이전 기간"
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-hairline hover:bg-canvas-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && pendingAction === "prev" ? <Spinner dark /> : "◀"}
        </button>
        <input
          type="date"
          value={since}
          max={until}
          disabled={isPending}
          onChange={(e) => setSince(e.target.value)}
          className="rounded-sm border border-hairline px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="text-ink-mute">→</span>
        <input
          type="date"
          value={until}
          min={since}
          disabled={isPending}
          onChange={(e) => setUntil(e.target.value)}
          className="rounded-sm border border-hairline px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={isPending}
          aria-label="다음 기간"
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-hairline hover:bg-canvas-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && pendingAction === "next" ? <Spinner dark /> : "▶"}
        </button>
        <button
          type="button"
          onClick={() => applyRange(since, until, "apply")}
          disabled={isPending}
          className="flex items-center gap-2 rounded-sm bg-primary px-3 py-1 font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && pendingAction === "apply" && <Spinner />}
          {isPending && pendingAction === "apply" ? "조회 중..." : "조회"}
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-mute">
        조회 결과: {range.since} ~ {range.until} ({resultCount.toLocaleString("ko-KR")}건)
      </p>
    </div>
  );
}
