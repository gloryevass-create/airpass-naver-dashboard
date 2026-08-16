"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import type { DashboardData } from "@/lib/queries/dashboard";

function formatSpend(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

type Row = DashboardData["adSpendByCompetitor"][number];

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;

  return (
    <div className="max-w-xs rounded-md border border-neutral-200 bg-white p-3 text-xs shadow-md">
      <p className="mb-1 font-semibold">{row.competitorName}</p>
      <p className="mb-2 text-neutral-600">
        합계(추정): {formatSpend(row.totalSpend)}
      </p>
      <p className="mb-1 text-[11px] text-neutral-400">
        키워드별 산출 근거 (추정치 — calc_basis 기준)
      </p>
      <ul className="flex flex-col gap-0.5">
        {row.breakdown.slice(0, 5).map((b, i) => (
          <li key={i} className="flex justify-between gap-2 text-neutral-600">
            <span className="truncate">{b.keyword}</span>
            <span className="shrink-0">{formatSpend(b.estimatedMonthlySpend)}</span>
          </li>
        ))}
        {row.breakdown.length > 5 && (
          <li className="text-neutral-400">외 {row.breakdown.length - 5}개 키워드</li>
        )}
      </ul>
    </div>
  );
}

export function AdSpendChart({ data }: { data: DashboardData["adSpendByCompetitor"] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm text-neutral-400">데이터 없음</p>
        <p className="max-w-xs text-[11px] text-neutral-400">
          경쟁사 광고비는 네이버가 제3자에게 공개하는 공식 API가 없고 자동 수집 경로(스크래핑)도
          막혀 있어(robots.txt) 자동으로 수집하지 못합니다. 근거 없는 추정치를 표시하지 않습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="competitorName"
            fontSize={12}
            stroke="#737373"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis fontSize={12} stroke="#737373" width={48} />
          <Tooltip content={CustomTooltip} />
          <Bar dataKey="totalSpend" fill="#404040" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-neutral-400">
        * 광고비는 노출순위·CPC·가정 클릭률 등을 바탕으로 한 추정치입니다. 막대에 마우스를 올리면 키워드별 산출 근거를 볼 수 있습니다.
      </p>
    </div>
  );
}
