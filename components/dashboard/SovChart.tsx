"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

const COLORS = ["#4a154b", "#1264a3", "#611f69", "#3860be", "#8a5a8f", "#696969", "#c9a0cf", "#a3a3a3"];

export function SovChart({ data }: { data: DashboardData["sov"] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-mute">데이터가 없습니다.</p>;
  }

  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            <XAxis
              dataKey="competitorName"
              fontSize={12}
              stroke="#696969"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis fontSize={12} stroke="#696969" width={40} unit="%" />
            <Tooltip formatter={(value) => [`${value}%`, "평균 노출 점유율"]} />
            <Bar dataKey="sharePct" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.competitorId}
                  fill={entry.sharePct > 0 ? COLORS[index % COLORS.length] : "#e6e6e6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-ink-mute">
        * 블로그별로 독립적으로 계산된 값이라 합계가 100%가 아닙니다 — 파이 차트가 아니라
        막대 차트로 표시합니다.
      </p>
    </div>
  );
}
