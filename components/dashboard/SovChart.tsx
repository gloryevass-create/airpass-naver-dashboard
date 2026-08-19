"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

const COLORS = ["#5865f2", "#00b0f4", "#7c3aed", "#3dd0ff", "#9b6bc9", "#9aa0c9", "#ec48bd", "#c2d9f7"];

export function SovChart({ data }: { data: DashboardData["sov"] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-mute">데이터가 없습니다.</p>;
  }

  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
            <XAxis
              dataKey="competitorName"
              fontSize={12}
              stroke="var(--color-ink-mute)"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis fontSize={12} stroke="var(--color-ink-mute)" width={40} unit="%" />
            <Tooltip
              formatter={(value) => [`${value}%`, "평균 노출 점유율"]}
              contentStyle={{
                backgroundColor: "var(--color-canvas-cream)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "0.625rem",
                color: "var(--color-ink)",
              }}
              labelStyle={{ color: "var(--color-ink-mute)" }}
            />
            <Bar dataKey="sharePct" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.competitorId}
                  fill={entry.sharePct > 0 ? COLORS[index % COLORS.length] : "var(--color-hairline)"}
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
