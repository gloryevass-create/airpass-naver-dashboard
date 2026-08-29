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
    <div style={{ height: 256, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
          <XAxis dataKey="date" fontSize={12} stroke="color-mix(in srgb, var(--color-text) 55%, transparent)" />
          <YAxis
            reversed
            fontSize={12}
            stroke="color-mix(in srgb, var(--color-text) 55%, transparent)"
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            formatter={(value) => [value != null ? `${value}위` : "데이터 없음", "평균 노출순위"]}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid var(--color-divider)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text)",
            }}
            labelStyle={{ color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
          />
          <Line
            type="monotone"
            dataKey="avgRank"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
