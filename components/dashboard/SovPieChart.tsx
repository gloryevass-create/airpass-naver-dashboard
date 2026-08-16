"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

const COLORS = ["#4a154b", "#1264a3", "#611f69", "#3860be", "#8a5a8f", "#696969", "#c9a0cf", "#a3a3a3"];

export function SovPieChart({ data }: { data: DashboardData["sov"] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-mute">데이터가 없습니다.</p>;
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
            label={(entry) => {
              const pct = (entry as unknown as (typeof data)[number]).sharePct;
              return pct > 0 ? `${pct}%` : "";
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.competitorId}
                fill={entry.sharePct > 0 ? COLORS[index % COLORS.length] : "#e6e6e6"}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}%`, "평균 노출 점유율"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
