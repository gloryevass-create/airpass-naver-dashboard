"use client";

import { useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

// 트리맵 사각형 10개를 구분하기 위한 색상표 — 카테고리 구분용이라 Industry
// 테마의 단색 accent로 바꾸지 않고 그대로 유지한다(Calendar TAG_DOT_COLORS와
// 같은 이유, 2026-08-29).
const COLORS = ["#0066cc", "#34c759", "#ff9500", "#ff3b30", "#af52de", "#30b0c7", "#ff2d55", "#5856d6", "#8bb4f0", "#7a7a7a"];

type Mode = "search" | "spend" | "cpc";

type TreemapNode = {
  name: string;
  size: number;
  rank: number;
  sub1: number;
  sub2: number;
};

function buildData(keywordTable: DashboardData["keywordTable"], mode: Mode): TreemapNode[] {
  return [...keywordTable]
    .map((k) => {
      if (mode === "search") {
        return {
          name: k.keyword,
          size: (k.monthlySearchPc ?? 0) + (k.monthlySearchMobile ?? 0),
          sub1: k.monthlySearchPc ?? 0,
          sub2: k.monthlySearchMobile ?? 0,
        };
      }
      if (mode === "spend") {
        return {
          name: k.keyword,
          size: k.spend7d ?? 0,
          sub1: k.avgCpc ?? 0,
          sub2: (k.monthlyClickPc ?? 0) + (k.monthlyClickMobile ?? 0),
        };
      }
      return {
        name: k.keyword,
        size: k.avgCpc ?? 0,
        sub1: k.spend7d ?? 0,
        sub2: (k.monthlyClickPc ?? 0) + (k.monthlyClickMobile ?? 0),
      };
    })
    .filter((k) => k.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map((k, i) => ({ ...k, rank: i + 1 }));
}

// Recharts는 렌더링 시점에 원본 데이터를 자체 트리맵 노드 구조(value/depth/root 등)와
// 합쳐서 content 렌더러에 넘긴다 — dataKey로 지정한 "size"뿐 아니라 계산된 "value"도
// 함께 들어올 수 있어 둘 다 안전하게 처리한다(하나가 없어도 절대 크래시하지 않도록).
type CustomContentProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  size?: number;
  value?: number;
  formatValue?: (n: number) => string;
};

function CustomContent(props: CustomContentProps) {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const width = props.width ?? 0;
  const height = props.height ?? 0;
  const index = props.index ?? 0;
  const name = props.name ?? "";
  const value = props.size ?? props.value ?? 0;
  const formatValue = props.formatValue ?? ((n: number) => n.toLocaleString("ko-KR"));

  if (width < 2 || height < 2) return null;
  const showText = width > 50 && height > 30;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: "#fff",
          strokeWidth: 2,
        }}
      />
      {showText && (
        <>
          <text x={x + 8} y={y + 20} fontSize={13} fontWeight={700} fill="#fff">
            {name}
          </text>
          <text x={x + 8} y={y + 38} fontSize={11} fill="#ffffffcc">
            {formatValue(value)}
          </text>
        </>
      )}
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: { payload: Partial<TreemapNode> }[];
  mode: Mode;
}) {
  if (!active || !payload?.length) return null;
  const node = payload[0].payload;
  return (
    <div style={{ border: "1px solid var(--color-divider)", background: "#ffffff", padding: "var(--space-3)", fontSize: 12, boxShadow: "var(--shadow-md)" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
        {node.rank ?? "-"}위 · {node.name ?? ""}
      </p>
      {mode === "search" && (
        <>
          <p className="text-muted" style={{ margin: 0 }}>월간검색수 합계: {(node.size ?? 0).toLocaleString("ko-KR")}</p>
          <p className="text-muted" style={{ margin: 0 }}>
            PC {(node.sub1 ?? 0).toLocaleString("ko-KR")} · 모바일 {(node.sub2 ?? 0).toLocaleString("ko-KR")}
          </p>
        </>
      )}
      {mode === "spend" && (
        <>
          <p className="text-muted" style={{ margin: 0 }}>최근 7일 지출액: {(node.size ?? 0).toLocaleString("ko-KR")}원</p>
          <p className="text-muted" style={{ margin: 0 }}>
            평균 CPC {(node.sub1 ?? 0).toLocaleString("ko-KR")}원 · 월간클릭수(PC+모바일){" "}
            {(node.sub2 ?? 0).toLocaleString("ko-KR")}
          </p>
        </>
      )}
      {mode === "cpc" && (
        <>
          <p className="text-muted" style={{ margin: 0 }}>평균 CPC: {(node.size ?? 0).toLocaleString("ko-KR")}원</p>
          <p className="text-muted" style={{ margin: 0 }}>
            최근 7일 지출액 {(node.sub1 ?? 0).toLocaleString("ko-KR")}원 · 월간클릭수(PC+모바일){" "}
            {(node.sub2 ?? 0).toLocaleString("ko-KR")}
          </p>
        </>
      )}
    </div>
  );
}

const TABS: { key: Mode; label: string }[] = [
  { key: "search", label: "핫 키워드 TOP10" },
  { key: "spend", label: "핫 비용 TOP10" },
  { key: "cpc", label: "핫 CPC TOP10" },
];

export function HotKeywordTreemap({ keywordTable }: { keywordTable: DashboardData["keywordTable"] }) {
  const [mode, setMode] = useState<Mode>("search");
  const data = buildData(keywordTable, mode);
  const formatValue = (n: number) =>
    mode === "search" ? n.toLocaleString("ko-KR") : `${n.toLocaleString("ko-KR")}원`;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-divider)", marginBottom: "var(--space-3)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            style={{
              marginBottom: -1,
              borderBottom: `2px solid ${mode === tab.key ? "var(--color-accent)" : "transparent"}`,
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 500,
              background: "none",
              color: mode === tab.key ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 55%, transparent)",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="text-muted" style={{ padding: "var(--space-6) 0", textAlign: "center", fontSize: 13 }}>데이터가 없습니다.</p>
      ) : (
        <>
          <div style={{ height: 288, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={data}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<CustomContent formatValue={formatValue} />}
              >
                <Tooltip content={<CustomTooltip mode={mode} />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
          <p className="text-muted" style={{ margin: "var(--space-2) 0 0", fontSize: 11 }}>
            {mode === "search" &&
              "* 월간검색수(PC+모바일) 기준 상위 10개 키워드 — 사각형 크기가 검색량에 비례합니다."}
            {mode === "spend" &&
              "* 최근 7일 실제 집행 지출액 기준 상위 10개 키워드 — 사각형 크기가 지출액에 비례합니다. 클릭이 없었던 키워드는 지출액도 0이라 제외됩니다."}
            {mode === "cpc" &&
              "* 최근 7일 실제 집행 평균 CPC 기준 상위 10개 키워드 — 사각형 크기가 CPC에 비례합니다. 클릭이 없었던 키워드는 CPC를 계산할 근거가 없어 제외됩니다."}
          </p>
        </>
      )}
    </div>
  );
}
