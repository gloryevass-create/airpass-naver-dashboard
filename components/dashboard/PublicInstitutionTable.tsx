"use client";

import { useMemo, useState } from "react";
import type { PublicInstitution } from "@/lib/queries/publicInstitutions";

type SortKey = "siteName" | "institutionType" | "institutionCategory" | "detailCategory";

const DISPLAY_COLUMNS: { key: keyof PublicInstitution; label: string; sortKey?: SortKey }[] = [
  { key: "siteName", label: "사이트명", sortKey: "siteName" },
  { key: "institutionType", label: "기관유형", sortKey: "institutionType" },
  { key: "institutionCategory", label: "기관분류", sortKey: "institutionCategory" },
  { key: "detailCategory", label: "상세기관분류", sortKey: "detailCategory" },
];

const EXPORT_COLUMNS: { key: keyof PublicInstitution; label: string }[] = [
  ...DISPLAY_COLUMNS,
  { key: "siteType", label: "사이트구분" },
  { key: "url", label: "URL" },
];

const COUNT_OPTIONS = [100, 300, 500, "전체"] as const;
type CountOption = (typeof COUNT_OPTIONS)[number];

function cell(value: PublicInstitution[keyof PublicInstitution]): string {
  if (value == null || value === "") return "-";
  return String(value);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(institutions: PublicInstitution[]) {
  const header = EXPORT_COLUMNS.map((c) => c.label).join(",");
  const rows = institutions.map((i) => EXPORT_COLUMNS.map((col) => csvEscape(cell(i[col.key]))).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `공공기관정보_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatBlock({
  title,
  counts,
  active,
  onSelect,
}: {
  title: string;
  counts: [string, number][];
  active: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="rounded-xl border border-hairline p-3">
      <h3 className="mb-2 text-xs font-semibold text-ink-mute">
        {title}
        {active && (
          <button type="button" onClick={() => onSelect(active)} className="ml-2 text-link-blue hover:underline">
            필터 해제
          </button>
        )}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {counts.map(([label, n]) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                isActive ? "bg-primary text-white" : "bg-canvas-cream text-ink hover:bg-canvas-lavender"
              }`}
            >
              {label} <span className={isActive ? "font-semibold" : "font-semibold text-primary"}>{n.toLocaleString("ko-KR")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PublicInstitutionTable({ institutions }: { institutions: PublicInstitution[] }) {
  const [institutionType, setInstitutionType] = useState<string | null>(null);
  const [institutionCategory, setInstitutionCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("institutionType");
  const [sortAsc, setSortAsc] = useState(true);
  const [count, setCount] = useState<CountOption>(300);

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of institutions) {
      const key = i.institutionType ?? "미상";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [institutions]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of institutions) {
      const key = i.institutionCategory ?? "미상";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [institutions]);

  const filtered = useMemo(() => {
    return institutions
      .filter((i) => !institutionType || (i.institutionType ?? "미상") === institutionType)
      .filter((i) => !institutionCategory || (i.institutionCategory ?? "미상") === institutionCategory)
      .filter((i) => !search || i.siteName.includes(search));
  }, [institutions, institutionType, institutionCategory, search]);

  const sorted = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc]);

  const visible = count === "전체" ? sorted : sorted.slice(0, count);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function selectType(label: string) {
    setInstitutionType((prev) => (prev === label ? null : label));
  }

  function selectCategory(label: string) {
    setInstitutionCategory((prev) => (prev === label ? null : label));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <StatBlock
          title={`기관유형별 현황 (${typeCounts.length}종) — 클릭하면 아래 목록이 필터링됩니다`}
          counts={typeCounts}
          active={institutionType}
          onSelect={selectType}
        />
        <StatBlock
          title={`기관분류별 현황 (${categoryCounts.length}종) — 클릭하면 아래 목록이 필터링됩니다`}
          counts={categoryCounts}
          active={institutionCategory}
          onSelect={selectCategory}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="사이트명 검색"
          className="rounded-md border border-hairline px-3 py-1.5 text-ink outline-none focus:border-primary"
        />
        <span className="text-xs text-ink-mute">
          전체 {sorted.length.toLocaleString("ko-KR")}곳 중 {visible.length.toLocaleString("ko-KR")}곳 표시
        </span>
        <label className="flex items-center gap-2 text-xs text-ink-mute">
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
        <button
          type="button"
          onClick={() => downloadCsv(institutions)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          전체 DB 엑셀 다운로드 ({institutions.length.toLocaleString("ko-KR")}건, 전체 필드)
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-hairline">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-canvas-cream text-left text-ink-mute">
            <tr>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">번호</th>
              {DISPLAY_COLUMNS.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-2 py-1.5 font-medium">
                  {col.sortKey ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.sortKey!)}
                      className="flex items-center gap-1 hover:text-ink"
                    >
                      {col.label}
                      {sortKey === col.sortKey && <span>{sortAsc ? "▲" : "▼"}</span>}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((i, idx) => (
              <tr key={i.id} className="border-t border-hairline">
                <td className="whitespace-nowrap px-2 py-1 text-ink-mute">{idx + 1}</td>
                {DISPLAY_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-2 py-1">
                    {col.key === "siteName" && i.url ? (
                      <a
                        href={i.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link-blue hover:underline"
                      >
                        {i.siteName}
                      </a>
                    ) : (
                      cell(i[col.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={DISPLAY_COLUMNS.length + 1} className="px-4 py-6 text-center text-ink-mute">
                  조건에 맞는 기관이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
