"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChannelStatsResult } from "@/lib/queries/youtube";

export function YoutubeChannelStats({ data }: { data: ChannelStatsResult }) {
  const chartData = data.trend.map((d) => ({
    date: d.date.slice(5),
    구독자수: d.subscriberCount,
    조회수: d.viewCount,
  }));

  return (
    <div className="rounded-xl border border-hairline p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-hairline p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#e41e3f]">구독자 수</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {(data.latest?.subscriberCount ?? 0).toLocaleString("ko-KR")}명
          </p>
        </div>
        <div className="rounded-lg border border-hairline p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#b8790a]">전체 조회수</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {(data.latest?.viewCount ?? 0).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="rounded-lg border border-hairline p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-link-blue">영상 수</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {(data.latest?.videoCount ?? 0).toLocaleString("ko-KR")}개
          </p>
        </div>
      </div>

      {chartData.length < 2 ? (
        <p className="mt-4 py-6 text-center text-sm text-ink-mute">
          아직 추이를 그릴 만큼 데이터가 쌓이지 않았습니다(하루 1회 스냅샷 — 며칠 지나면
          그래프가 채워집니다).
        </p>
      ) : (
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" />
              <XAxis dataKey="date" fontSize={12} stroke="var(--color-ink-mute)" />
              {/* 구독자 수(수십~수백)와 조회수(수만)의 규모 차이가 커서 축을 따로 둔다. */}
              <YAxis yAxisId="sub" hide domain={["auto", "auto"]} />
              <YAxis yAxisId="view" hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-canvas-cream)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-ink)",
                }}
                labelStyle={{ color: "var(--color-ink-mute)" }}
              />
              <Line yAxisId="sub" type="monotone" dataKey="구독자수" stroke="#e41e3f" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="view" type="monotone" dataKey="조회수" stroke="#b8790a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
