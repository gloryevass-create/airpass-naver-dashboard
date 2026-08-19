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

export function RankTrendChart({ data }: { data: DashboardData["rankTrend"] }) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    avgRank: d.avgRank,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
          <XAxis dataKey="date" fontSize={12} stroke="var(--color-ink-mute)" />
          <YAxis
            reversed
            fontSize={12}
            stroke="var(--color-ink-mute)"
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            formatter={(value) => [value != null ? `${value}위` : "데이터 없음", "평균 노출순위"]}
            contentStyle={{
              backgroundColor: "var(--color-canvas-cream)",
              border: "1px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-ink)",
            }}
            labelStyle={{ color: "var(--color-ink-mute)" }}
          />
          <Line
            type="monotone"
            dataKey="avgRank"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
