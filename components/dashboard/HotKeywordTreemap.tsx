"use client";

import { useState } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

const COLORS = ["#4a154b", "#611f69", "#7c3aed", "#9b6bc9", "#b794d4", "#1264a3", "#3860be", "#5b8def", "#8bb4f0", "#c2d9f7"];

type Mode = "search" | "spend";

type TreemapNode = {
  name: string;
  size: number;
  rank: number;
  sub1: number;
  sub2: number;
};

function buildData(keywordTable: DashboardData["keywordTable"], mode: Mode): TreemapNode[] {
  return [...keywordTable]
    .map((k) =>
      mode === "search"
        ? {
            name: k.keyword,
            size: (k.monthlySearchPc ?? 0) + (k.monthlySearchMobile ?? 0),
            sub1: k.monthlySearchPc ?? 0,
            sub2: k.monthlySearchMobile ?? 0,
          }
        : {
            name: k.keyword,
            size: k.spend7d ?? 0,
            sub1: k.avgCpc ?? 0,
            sub2: (k.monthlyClickPc ?? 0) + (k.monthlyClickMobile ?? 0),
          }
    )
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
    <div className="rounded-md border border-hairline bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold">
        {node.rank ?? "-"}위 · {node.name ?? ""}
      </p>
      {mode === "search" ? (
        <>
          <p className="text-ink-mute">월간검색수 합계: {(node.size ?? 0).toLocaleString("ko-KR")}</p>
          <p className="text-ink-mute">
            PC {(node.sub1 ?? 0).toLocaleString("ko-KR")} · 모바일 {(node.sub2 ?? 0).toLocaleString("ko-KR")}
          </p>
        </>
      ) : (
        <>
          <p className="text-ink-mute">최근 7일 지출액: {(node.size ?? 0).toLocaleString("ko-KR")}원</p>
          <p className="text-ink-mute">
            평균 CPC {(node.sub1 ?? 0).toLocaleString("ko-KR")}원 · 월간클릭수(PC+모바일){" "}
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
];

export function HotKeywordTreemap({ keywordTable }: { keywordTable: DashboardData["keywordTable"] }) {
  const [mode, setMode] = useState<Mode>("search");
  const data = buildData(keywordTable, mode);
  const formatValue = (n: number) => (mode === "spend" ? `${n.toLocaleString("ko-KR")}원` : n.toLocaleString("ko-KR"));

  return (
    <div className="w-full">
      <div className="mb-3 flex gap-1 border-b border-hairline">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-ink-mute hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-mute">데이터가 없습니다.</p>
      ) : (
        <>
          <div className="h-72 w-full">
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
          <p className="mt-2 text-[11px] text-ink-mute">
            {mode === "search"
              ? "* 월간검색수(PC+모바일) 기준 상위 10개 키워드 — 사각형 크기가 검색량에 비례합니다."
              : "* 최근 7일 실제 집행 지출액 기준 상위 10개 키워드 — 사각형 크기가 지출액에 비례합니다. 클릭이 없었던 키워드는 지출액도 0이라 제외됩니다."}
          </p>
        </>
      )}
    </div>
  );
}
