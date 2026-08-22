"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-mute/30 border-t-ink" />
  );
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function EventMonthNav({ basePath, month }: { basePath: string; month: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"prev" | "next" | "today" | null>(null);

  function go(newMonth: string, action: "prev" | "next" | "today") {
    setPendingAction(action);
    startTransition(() => {
      router.push(`${basePath}?month=${newMonth}`);
    });
  }

  const [y, m] = month.split("-").map(Number);

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => go(shiftMonth(month, -1), "prev")}
        disabled={isPending}
        aria-label="이전 달"
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-hairline hover:bg-canvas-cream disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && pendingAction === "prev" ? <Spinner /> : "◀"}
      </button>
      <span className="min-w-20 text-center font-semibold text-ink">
        {y}년 {m}월
      </span>
      <button
        type="button"
        onClick={() => go(shiftMonth(month, 1), "next")}
        disabled={isPending}
        aria-label="다음 달"
        className="flex h-7 w-7 items-center justify-center rounded-sm border border-hairline hover:bg-canvas-cream disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && pendingAction === "next" ? <Spinner /> : "▶"}
      </button>
      <button
        type="button"
        onClick={() => {
          const now = new Date();
          go(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, "today");
        }}
        disabled={isPending}
        className="flex items-center gap-2 rounded-sm border border-hairline px-3 py-1 font-medium text-ink hover:bg-canvas-cream disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && pendingAction === "today" && <Spinner />}
        오늘
      </button>
    </div>
  );
}
