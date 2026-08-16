"use client";

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

export function AdAccountStatsPanel({ data }: { data: DashboardData["adAccountStats"] }) {
  if (data.trend.length === 0) {
    return (
      <div className="rounded-xl border border-hairline p-6 text-sm text-ink-mute">
        아직 계정 성과지표 데이터가 없습니다.
      </div>
    );
  }

  const chartData = data.trend.map((d) => ({
    date: d.date.slice(5),
    노출수: d.impCnt,
    클릭수: d.clkCnt,
    전환수: d.ccnt,
  }));

  return (
    <div className="rounded-xl border border-hairline p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-mute">
          광고 성과지표 (최근 {data.trend.length}일)
        </h2>
        <div className="rounded-lg bg-canvas-cream px-3 py-1.5 text-xs text-ink-mute">
          비즈머니 잔액{" "}
          <span className="font-bold text-primary">{formatWon(data.bizmoney)}</span>
          {data.latestDate && (
            <span className="ml-1 text-ink-mute">({data.latestDate} 기준)</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-hairline p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c0392b]">총 노출수</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {data.totals.impCnt.toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="rounded-lg border border-hairline p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#d68910]">총 클릭수</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {data.totals.clkCnt.toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="rounded-lg border border-hairline p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1264a3]">총 전환수</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {data.totals.ccnt.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            <XAxis dataKey="date" fontSize={12} stroke="#696969" />
            <YAxis fontSize={12} stroke="#696969" width={40} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="노출수" stroke="#c0392b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="클릭수" stroke="#d68910" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="전환수" stroke="#1264a3" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
