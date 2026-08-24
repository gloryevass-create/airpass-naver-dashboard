"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

const COLORS = ["#0066cc", "#34c759", "#ff9500", "#af52de", "#30b0c7", "#ff2d55"];
const OTHERS_COLOR = "#a0a0a8";

function formatDateTick(value: string): string {
  const [, month, day] = value.split("-");
  return `${month}/${day}`;
}

function colorFor(key: string, index: number): string {
  return key === "기타 평균" ? OTHERS_COLOR : COLORS[index % COLORS.length];
}

export function SovTrendChart({ data }: { data: DashboardData["sovTrend"] }) {
  if (data.rows.length === 0 || data.keys.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-mute">데이터가 없습니다.</p>;
  }

  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              fontSize={12}
              stroke="var(--color-ink-mute)"
            />
            <YAxis fontSize={12} stroke="var(--color-ink-mute)" width={40} unit="%" />
            <Tooltip
              labelFormatter={(label) => formatDateTick(String(label))}
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{
                backgroundColor: "var(--color-canvas-cream)",
                border: "1px solid var(--color-hairline)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-ink)",
              }}
              labelStyle={{ color: "var(--color-ink-mute)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {data.keys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorFor(key, index)}
                strokeWidth={2}
                strokeDasharray={key === "기타 평균" ? "4 3" : undefined}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-ink-mute">
        * 채널별로 독립적으로 계산된 값이라 합계가 100%가 아닙니다. 노출 점유율 상위 6곳만
        개별 선으로, 나머지는 &ldquo;기타 평균&rdquo; 한 선으로 표시합니다.
      </p>
    </div>
  );
}
