"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

const COLORS = ["#171717", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#f59e0b", "#0ea5e9", "#ef4444"];

export function SovPieChart({ data }: { data: DashboardData["sov"] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-neutral-400">데이터가 없습니다.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="sharePct"
            nameKey="competitorName"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={(entry) => `${(entry as unknown as (typeof data)[number]).sharePct}%`}
          >
            {data.map((entry, index) => (
              <Cell key={entry.competitorId} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, "평균 노출 점유율"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
