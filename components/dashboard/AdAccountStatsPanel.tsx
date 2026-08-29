"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

function formatWon(value: number | null) {
  if (value == null) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
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

export function AdAccountStatsPanel({ data }: { data: DashboardData["adAccountStats"] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"prev" | "next" | "apply" | null>(null);
  const [since, setSince] = useState(data.range.since);
  const [until, setUntil] = useState(data.range.until);

  function applyRange(newSince: string, newUntil: string, action: "prev" | "next" | "apply" = "apply") {
    setPendingAction(action);
    const params = new URLSearchParams({ statsFrom: newSince, statsTo: newUntil });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
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

  const chartData = data.trend.map((d) => ({
    date: d.date.slice(5),
    노출수: d.impCnt,
    클릭수: d.clkCnt,
    평균CPC: d.cpc,
    CPM: d.cpm,
  }));

  return (
    <div className="card">
      <div style={{ marginBottom: "var(--space-4)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }} className="text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M18 9l-5 5-3-3-4 4" />
          </svg>
          광고 성과지표
        </h2>
        <div className="tag tag-neutral" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          비즈머니 잔액 <strong style={{ color: "var(--color-accent-700)" }}>{formatWon(data.bizmoney)}</strong>
          {data.latestDate && <span>({data.latestDate} 기준)</span>}
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 13 }}>
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

      <p className="text-muted" style={{ marginBottom: "var(--space-4)", fontSize: 12 }}>
        조회 결과: {data.range.since} ~ {data.range.until} (데이터 {data.trend.length}일치)
      </p>

      {data.trend.length === 0 ? (
        <p className="text-muted" style={{ padding: "var(--space-8) 0", textAlign: "center", fontSize: 13 }}>
          선택한 기간에 데이터가 없습니다.
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-4)", opacity: isPending ? 0.4 : 1, transition: "opacity 0.15s" }}>
            <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#d9342b" }}>총 노출수</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                {data.totals.impCnt.toLocaleString("ko-KR")}
              </p>
            </div>
            <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c2760a" }}>총 클릭수</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                {data.totals.clkCnt.toLocaleString("ko-KR")}
              </p>
            </div>
            <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0a8f86" }}>평균 CPC</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                {data.totals.avgCpc.toLocaleString("ko-KR")}원
              </p>
            </div>
            <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent-700)" }}>평균 CPM</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                {data.totals.avgCpm.toLocaleString("ko-KR")}원
              </p>
            </div>
          </div>

          <div style={{ marginTop: "var(--space-4)", height: 256, width: "100%", opacity: isPending ? 0.4 : 1, transition: "opacity 0.15s" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                <XAxis dataKey="date" fontSize={12} stroke="color-mix(in srgb, var(--color-text) 55%, transparent)" />
                {/* 지표마다 값의 규모 차이가 커서(노출수는 수천, 클릭수는 수십) 하나의
                    세로축을 공유하면 작은 값의 선이 바닥에 붙어 모양이 안 보인다 — 지표별로
                    숨긴 축을 따로 둬서 각자 자기 범위에 맞게 꽉 차게 그려지도록 한다(단위
                    비교가 아니라 추이 모양을 보기 위한 차트). */}
                <YAxis yAxisId="imp" hide domain={["auto", "auto"]} />
                <YAxis yAxisId="clk" hide domain={["auto", "auto"]} />
                <YAxis yAxisId="cpc" hide domain={["auto", "auto"]} />
                <YAxis yAxisId="cpm" hide domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--color-divider)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-text)",
                  }}
                  labelStyle={{ color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
                />
                <Line yAxisId="imp" type="monotone" dataKey="노출수" stroke="#d9342b" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="clk" type="monotone" dataKey="클릭수" stroke="#c2760a" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="cpc" type="monotone" dataKey="평균CPC" stroke="#0a8f86" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="cpm" type="monotone" dataKey="CPM" stroke="var(--color-accent-700)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
