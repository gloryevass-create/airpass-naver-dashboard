"use client";

import { useMemo, useState } from "react";
import type { DisabilitySportsFacility } from "@/lib/queries/disabilitySportsFacilities";

type SortKey = "facilityName" | "provinceName" | "districtName";

const DISPLAY_COLUMNS: { key: keyof DisabilitySportsFacility; label: string; sortKey?: SortKey }[] = [
  { key: "facilityName", label: "시설명", sortKey: "facilityName" },
  { key: "provinceName", label: "시도", sortKey: "provinceName" },
  { key: "districtName", label: "소재지(구·군)", sortKey: "districtName" },
  { key: "operatingBody", label: "운영기관" },
  { key: "phoneNumber", label: "전화번호" },
  { key: "homepageUrl", label: "홈페이지" },
  { key: "hasVoucherProgram", label: "바우처시설" },
  { key: "hasBandabiFacility", label: "반다비시설" },
];

const EXPORT_COLUMNS: { key: keyof DisabilitySportsFacility; label: string }[] = DISPLAY_COLUMNS;

const COUNT_OPTIONS = [100, 300, "전체"] as const;
type CountOption = (typeof COUNT_OPTIONS)[number];

function cell(value: DisabilitySportsFacility[keyof DisabilitySportsFacility]): string {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Y" : "N";
  return String(value);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(facilities: DisabilitySportsFacility[]) {
  const header = EXPORT_COLUMNS.map((c) => c.label).join(",");
  const rows = facilities.map((f) => EXPORT_COLUMNS.map((c) => csvEscape(cell(f[c.key]))).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `장애인체육시설_${new Date().toISOString().slice(0, 10)}.csv`;
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

export function DisabilitySportsTable({ facilities }: { facilities: DisabilitySportsFacility[] }) {
  const [province, setProvince] = useState("전체");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("provinceName");
  const [sortAsc, setSortAsc] = useState(true);
  const [count, setCount] = useState<CountOption>(100);

  const provinceCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of facilities) {
      const key = f.provinceName ?? "미상";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [facilities]);

  const provinces = useMemo(() => ["전체", ...provinceCounts.map(([label]) => label).sort()], [provinceCounts]);

  const filtered = useMemo(() => {
    return facilities
      .filter((f) => province === "전체" || (f.provinceName ?? "미상") === province)
      .filter((f) => !search || f.facilityName.includes(search) || f.districtName?.includes(search));
  }, [facilities, province, search]);

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

  function selectProvince(label: string) {
    setProvince((prev) => (prev === label ? "전체" : label));
  }

  return (
    <div className="flex flex-col gap-4">
      <StatBlock
        title={`지역별 현황 (시도 ${provinceCounts.length}곳) — 클릭하면 아래 목록이 필터링됩니다`}
        counts={provinceCounts}
        active={province === "전체" ? null : province}
        onSelect={selectProvince}
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="rounded-md border border-hairline bg-canvas-cream px-2 py-1.5 text-ink"
        >
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="시설명·소재지 검색"
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
          onClick={() => downloadCsv(facilities)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          전체 DB 엑셀 다운로드 ({facilities.length.toLocaleString("ko-KR")}건, 전체 필드)
        </button>
      </div>

      <div className="overflow-auto rounded-sm border border-hairline">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#f7f7f8] text-left text-ink-mute">
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
            {visible.map((f, i) => (
              <tr key={f.id} className="border-t border-hairline odd:bg-white even:bg-[#f7f7f8]">
                <td className="whitespace-nowrap px-2 py-1 text-ink-mute">{i + 1}</td>
                {DISPLAY_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-2 py-1">
                    {col.key === "homepageUrl" && f.homepageUrl ? (
                      <a
                        href={
                          f.homepageUrl.startsWith("http") ? f.homepageUrl : `https://${f.homepageUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link-blue hover:underline"
                      >
                        {f.homepageUrl}
                      </a>
                    ) : (
                      cell(f[col.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={DISPLAY_COLUMNS.length + 1} className="px-4 py-6 text-center text-ink-mute">
                  조건에 맞는 시설이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
