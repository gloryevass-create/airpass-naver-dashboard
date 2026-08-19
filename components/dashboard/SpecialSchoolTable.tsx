"use client";

import { useMemo, useState } from "react";
import type { SpecialSchool } from "@/lib/queries/specialSchools";

type SortKey = "schoolName" | "provinceName" | "disabilityDomain" | "foundationType" | "openingDate";

const DISPLAY_COLUMNS: { key: keyof SpecialSchool; label: string; sortKey?: SortKey }[] = [
  { key: "schoolName", label: "학교명", sortKey: "schoolName" },
  { key: "disabilityDomain", label: "장애영역", sortKey: "disabilityDomain" },
  { key: "provinceName", label: "시도", sortKey: "provinceName" },
  { key: "foundationType", label: "설립별", sortKey: "foundationType" },
  { key: "principalName", label: "교장명" },
  { key: "openingDate", label: "개교년월일", sortKey: "openingDate" },
  { key: "address", label: "주소" },
];

const EXPORT_COLUMNS: { key: keyof SpecialSchool; label: string }[] = [
  ...DISPLAY_COLUMNS,
  { key: "approvalDate", label: "인가년월일" },
  { key: "principalOfficePhone", label: "교장실" },
  { key: "adminOfficePhone", label: "행정실" },
  { key: "teacherOfficePhone", label: "교무실" },
  { key: "faxNumber", label: "팩스" },
  { key: "zipCode", label: "우편번호" },
  { key: "homepageUrl", label: "누리집" },
  { key: "referenceDate", label: "기준일자" },
];

const COUNT_OPTIONS = [100, 300, "전체"] as const;
type CountOption = (typeof COUNT_OPTIONS)[number];

function cell(value: SpecialSchool[keyof SpecialSchool]): string {
  if (value == null || value === "") return "-";
  return String(value);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(schools: SpecialSchool[]) {
  const header = EXPORT_COLUMNS.map((c) => c.label).join(",");
  const rows = schools.map((s) => EXPORT_COLUMNS.map((col) => csvEscape(cell(s[col.key]))).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `특수학교현황_${new Date().toISOString().slice(0, 10)}.csv`;
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

export function SpecialSchoolTable({ schools }: { schools: SpecialSchool[] }) {
  const [province, setProvince] = useState("전체");
  const [disabilityDomain, setDisabilityDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("provinceName");
  const [sortAsc, setSortAsc] = useState(true);
  const [count, setCount] = useState<CountOption>(300);

  const provinceCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of schools) {
      const key = s.provinceName ?? "미상";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [schools]);

  const domainCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of schools) {
      const key = s.disabilityDomain ?? "미상";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [schools]);

  const provinces = useMemo(() => ["전체", ...provinceCounts.map(([label]) => label).sort()], [provinceCounts]);

  const filtered = useMemo(() => {
    return schools
      .filter((s) => province === "전체" || (s.provinceName ?? "미상") === province)
      .filter((s) => !disabilityDomain || (s.disabilityDomain ?? "미상") === disabilityDomain)
      .filter((s) => !search || s.schoolName.includes(search));
  }, [schools, province, disabilityDomain, search]);

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

  function selectDomain(label: string) {
    setDisabilityDomain((prev) => (prev === label ? null : label));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatBlock
          title={`지역별 현황 (시도 ${provinceCounts.length}곳) — 클릭하면 아래 목록이 필터링됩니다`}
          counts={provinceCounts}
          active={province === "전체" ? null : province}
          onSelect={selectProvince}
        />
        <StatBlock
          title={`장애영역별 현황 (${domainCounts.length}종) — 클릭하면 아래 목록이 필터링됩니다`}
          counts={domainCounts}
          active={disabilityDomain}
          onSelect={selectDomain}
        />
      </div>

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
          placeholder="학교명 검색"
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
          onClick={() => downloadCsv(schools)}
          className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          전체 DB 엑셀 다운로드 ({schools.length.toLocaleString("ko-KR")}건, 전체 필드)
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
            {visible.map((s, i) => (
              <tr key={s.id} className="border-t border-hairline">
                <td className="whitespace-nowrap px-2 py-1 text-ink-mute">{i + 1}</td>
                {DISPLAY_COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-2 py-1">
                    {cell(s[col.key])}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={DISPLAY_COLUMNS.length + 1} className="px-4 py-6 text-center text-ink-mute">
                  조건에 맞는 학교가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
