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
import { NavIcon } from "@/components/icons/NavIcon";

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
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 ${
        dark ? "border-ink-mute/30 border-t-ink" : "border-white/40 border-t-white"
      }`}
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
    <div className="rounded-sm border border-hairline p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
          <NavIcon name="chart" className="h-4 w-4" />
          광고 성과지표
        </h2>
        <div className="flex items-center gap-1 rounded-lg bg-canvas-cream px-3 py-1.5 text-xs text-ink-mute">
          <NavIcon name="wallet" className="h-3.5 w-3.5" />
          비즈머니 잔액{" "}
          <span className="font-bold text-primary">{formatWon(data.bizmoney)}</span>
          {data.latestDate && (
            <span className="ml-1 text-ink-mute">({data.latestDate} 기준)</span>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
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

      <p className="mb-4 flex items-center gap-2 text-xs text-ink-mute">
        조회 결과: {data.range.since} ~ {data.range.until} (데이터 {data.trend.length}일치)
      </p>

      {data.trend.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-mute">선택한 기간에 데이터가 없습니다.</p>
      ) : (
        <>
          <div
            className={`grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-4 ${isPending ? "opacity-40" : ""}`}
          >
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#d9342b]">총 노출수</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                {data.totals.impCnt.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#c2760a]">총 클릭수</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                {data.totals.clkCnt.toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#0a8f86]">평균 CPC</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                {data.totals.avgCpc.toLocaleString("ko-KR")}원
              </p>
            </div>
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-link-blue">평균 CPM</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                {data.totals.avgCpm.toLocaleString("ko-KR")}원
              </p>
            </div>
          </div>

          <div className={`mt-4 h-64 w-full transition-opacity ${isPending ? "opacity-40" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
                <XAxis dataKey="date" fontSize={12} stroke="var(--color-ink-mute)" />
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
                    backgroundColor: "var(--color-canvas-cream)",
                    border: "1px solid var(--color-hairline)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--color-ink)",
                  }}
                  labelStyle={{ color: "var(--color-ink-mute)" }}
                />
                <Line yAxisId="imp" type="monotone" dataKey="노출수" stroke="#d9342b" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="clk" type="monotone" dataKey="클릭수" stroke="#c2760a" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="cpc" type="monotone" dataKey="평균CPC" stroke="#0a8f86" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="cpm" type="monotone" dataKey="CPM" stroke="var(--color-link-blue)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
