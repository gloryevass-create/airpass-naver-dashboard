"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        height: 14,
        width: 14,
        borderRadius: "50%",
        border: `2px solid ${dark ? "color-mix(in srgb, var(--color-text) 30%, transparent)" : "rgba(255,255,255,0.4)"}`,
        borderTopColor: dark ? "var(--color-text)" : "#ffffff",
        animation: "spin 0.6s linear infinite",
      }}
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
    <div className="card" style={{ background: "#ffffff", borderRadius: 8, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 13 }}>
        <button type="button" onClick={() => shift(-1)} disabled={isPending} aria-label="이전 기간" className="btn btn-secondary btn-icon">
          {isPending && pendingAction === "prev" ? <Spinner dark /> : "◀"}
        </button>
        <input type="date" value={since} max={until} disabled={isPending} onChange={(e) => setSince(e.target.value)} className="input" style={{ width: "auto" }} />
        <span className="text-muted">→</span>
        <input type="date" value={until} min={since} disabled={isPending} onChange={(e) => setUntil(e.target.value)} className="input" style={{ width: "auto" }} />
        <button type="button" onClick={() => shift(1)} disabled={isPending} aria-label="다음 기간" className="btn btn-secondary btn-icon">
          {isPending && pendingAction === "next" ? <Spinner dark /> : "▶"}
        </button>
        <button type="button" onClick={() => applyRange(since, until, "apply")} disabled={isPending} className="btn btn-primary">
          {isPending && pendingAction === "apply" && <Spinner />}
          {isPending && pendingAction === "apply" ? "조회 중..." : "조회"}
        </button>
      </div>
      <p className="text-muted" style={{ margin: "var(--space-3) 0 0", fontSize: 11 }}>
        조회 결과: {range.since} ~ {range.until} ({resultCount.toLocaleString("ko-KR")}건)
      </p>
    </div>
  );
}
