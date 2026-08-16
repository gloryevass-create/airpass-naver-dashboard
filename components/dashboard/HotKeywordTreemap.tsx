"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

const COLORS = ["#4a154b", "#611f69", "#7c3aed", "#9b6bc9", "#b794d4", "#1264a3", "#3860be", "#5b8def", "#8bb4f0", "#c2d9f7"];

type TreemapNode = {
  name: string;
  size: number;
  rank: number;
  pc: number;
  mobile: number;
};

function buildData(keywordTable: DashboardData["keywordTable"]): TreemapNode[] {
  return [...keywordTable]
    .map((k) => ({
      name: k.keyword,
      size: (k.monthlySearchPc ?? 0) + (k.monthlySearchMobile ?? 0),
      pc: k.monthlySearchPc ?? 0,
      mobile: k.monthlySearchMobile ?? 0,
    }))
    .filter((k) => k.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map((k, i) => ({ ...k, rank: i + 1 }));
}

function CustomContent(props: unknown) {
  const { x, y, width, height, index, name, size } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    index: number;
    name: string;
    size: number;
  };

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
            {size.toLocaleString("ko-KR")}
          </text>
        </>
      )}
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TreemapNode }[];
}) {
  if (!active || !payload?.length) return null;
  const node = payload[0].payload;
  return (
    <div className="rounded-md border border-hairline bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold">
        {node.rank}위 · {node.name}
      </p>
      <p className="text-ink-mute">월간검색수 합계: {node.size.toLocaleString("ko-KR")}</p>
      <p className="text-ink-mute">PC {node.pc.toLocaleString("ko-KR")} · 모바일 {node.mobile.toLocaleString("ko-KR")}</p>
    </div>
  );
}

export function HotKeywordTreemap({ keywordTable }: { keywordTable: DashboardData["keywordTable"] }) {
  const data = buildData(keywordTable);

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-mute">데이터가 없습니다.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-ink-mute">
        * 월간검색수(PC+모바일) 기준 상위 10개 키워드 — 사각형 크기가 검색량에 비례합니다.
      </p>
    </div>
  );
}
