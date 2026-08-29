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
    <div className="card" style={{ background: "#ffffff", borderRadius: 8, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)" }}>
        <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#d9342b" }}>구독자 수</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            {(data.latest?.subscriberCount ?? 0).toLocaleString("ko-KR")}명
          </p>
        </div>
        <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c2760a" }}>전체 조회수</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            {(data.latest?.viewCount ?? 0).toLocaleString("ko-KR")}
          </p>
        </div>
        <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent-700)" }}>영상 수</p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, fontFamily: "var(--font-heading)" }}>
            {(data.latest?.videoCount ?? 0).toLocaleString("ko-KR")}개
          </p>
        </div>
      </div>

      {chartData.length < 2 ? (
        <p className="text-muted" style={{ marginTop: "var(--space-4)", padding: "var(--space-6) 0", textAlign: "center", fontSize: 13 }}>
          아직 추이를 그릴 만큼 데이터가 쌓이지 않았습니다(하루 1회 스냅샷 — 며칠 지나면
          그래프가 채워집니다).
        </p>
      ) : (
        <div style={{ marginTop: "var(--space-4)", height: 256, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
              <XAxis dataKey="date" fontSize={12} stroke="color-mix(in srgb, var(--color-text) 55%, transparent)" />
              {/* 구독자 수(수십~수백)와 조회수(수만)의 규모 차이가 커서 축을 따로 둔다. */}
              <YAxis yAxisId="sub" hide domain={["auto", "auto"]} />
              <YAxis yAxisId="view" hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--color-divider)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                }}
                labelStyle={{ color: "color-mix(in srgb, var(--color-text) 55%, transparent)" }}
              />
              <Line yAxisId="sub" type="monotone" dataKey="구독자수" stroke="#d9342b" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="view" type="monotone" dataKey="조회수" stroke="#c2760a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
