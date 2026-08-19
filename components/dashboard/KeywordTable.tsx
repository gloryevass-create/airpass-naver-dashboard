"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/queries/dashboard";
import { naverSearchUrl } from "@/lib/naverLinks";

type Row = DashboardData["keywordTable"][number];
type SortKey = "keyword" | "ourRank" | "avgCpc" | "totalSearch" | "competitionLevel";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "keyword", label: "키워드" },
  { key: "ourRank", label: "노출순위" },
  { key: "avgCpc", label: "평균 CPC" },
  { key: "totalSearch", label: "월간검색수(PC+모바일)" },
  { key: "competitionLevel", label: "경쟁정도" },
];

const COUNT_OPTIONS = [200, 400, 600, 800, 1000, "전체"] as const;
type CountOption = (typeof COUNT_OPTIONS)[number];
const DEFAULT_COUNT: CountOption = 200;

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
  const [count, setCount] = useState<CountOption>(DEFAULT_COUNT);

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

  const visible = count === "전체" ? sorted : sorted.slice(0, count);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-ink-mute">
        <span>
          전체 {sorted.length.toLocaleString("ko-KR")}개 중 {visible.length.toLocaleString("ko-KR")}개 표시
        </span>
        <label className="flex items-center gap-2">
          표시 개수
          <select
            value={count}
            onChange={(e) => {
              const v = e.target.value;
              setCount(v === "전체" ? "전체" : (Number(v) as CountOption));
            }}
            className="rounded-md border border-hairline bg-canvas-cream px-2 py-1 text-ink"
          >
            {COUNT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "전체" ? "전체" : `${opt}개`}
              </option>
            ))}
          </select>
        </label>
      </div>
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
            {visible.map((row, i) => (
              <tr key={row.keywordId} className="border-t border-hairline">
                <td className="px-4 py-2 text-ink-mute">{i + 1}</td>
                <td className="px-4 py-2">
                  <a
                    href={naverSearchUrl(row.keyword)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link-blue hover:underline"
                  >
                    {row.keyword}
                  </a>
                </td>
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
            {visible.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-6 text-center text-ink-mute">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
