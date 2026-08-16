"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/queries/dashboard";

type Row = DashboardData["keywordTable"][number];
type SortKey = "keyword" | "ourRank" | "avgCpc" | "totalSearch" | "competitionLevel";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "keyword", label: "키워드" },
  { key: "ourRank", label: "노출순위" },
  { key: "avgCpc", label: "평균 CPC" },
  { key: "totalSearch", label: "월간검색수(PC+모바일)" },
  { key: "competitionLevel", label: "경쟁정도" },
];

function sortValue(row: Row, key: SortKey): string | number {
  switch (key) {
    case "keyword":
      return row.keyword;
    case "ourRank":
      return row.ourRank ?? Infinity;
    case "avgCpc":
      return row.avgCpc ?? -Infinity;
    case "totalSearch":
      return (row.monthlySearchPc ?? 0) + (row.monthlySearchMobile ?? 0);
    case "competitionLevel":
      return row.competitionLevel ?? "";
  }
}

export function KeywordTable({ data }: { data: Row[] }) {
  // 기본 정렬: 월간검색수(PC+모바일) 내림차순
  const [sortKey, setSortKey] = useState<SortKey>("totalSearch");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return data
      .slice()
      .sort((a, b) => {
        const av = sortValue(a, sortKey);
        const bv = sortValue(b, sortKey);
        const cmp = typeof av === "string" ? av.localeCompare(bv as string) : av - (bv as number);
        return sortAsc ? cmp : -cmp;
      });
  }, [data, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full text-sm">
        <thead className="bg-canvas-cream text-left text-ink-mute">
          <tr>
            <th className="px-4 py-2 font-medium">#</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-4 py-2 font-medium">
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-1 hover:text-ink"
                >
                  {col.label}
                  {sortKey === col.key && <span>{sortAsc ? "▲" : "▼"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.keywordId} className="border-t border-hairline">
              <td className="px-4 py-2 text-ink-mute">{i + 1}</td>
              <td className="px-4 py-2">{row.keyword}</td>
              <td className="px-4 py-2">{row.ourRank ?? "-"}</td>
              <td className="px-4 py-2">
                {row.avgCpc != null ? `${row.avgCpc.toLocaleString("ko-KR")}원` : "-"}
              </td>
              <td className="px-4 py-2">
                {((row.monthlySearchPc ?? 0) + (row.monthlySearchMobile ?? 0)).toLocaleString("ko-KR")}
                <span className="ml-1 text-xs text-ink-mute">
                  (PC {row.monthlySearchPc?.toLocaleString("ko-KR") ?? "-"} · 모바일{" "}
                  {row.monthlySearchMobile?.toLocaleString("ko-KR") ?? "-"})
                </span>
              </td>
              <td className="px-4 py-2">{row.competitionLevel ?? "-"}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="px-4 py-6 text-center text-ink-mute">
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
