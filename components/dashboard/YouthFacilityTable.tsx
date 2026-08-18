"use client";

import { useMemo, useState } from "react";
import type { YouthFacility } from "@/lib/queries/youthFacilities";

type SortKey = "facilityName" | "provinceName" | "districtName" | "facilityType" | "capacityCount";

const COLUMNS: { key: keyof YouthFacility; label: string; sortKey?: SortKey }[] = [
  { key: "facilityName", label: "시설명", sortKey: "facilityName" },
  { key: "facilityType", label: "시설유형", sortKey: "facilityType" },
  { key: "provinceName", label: "시도", sortKey: "provinceName" },
  { key: "districtName", label: "시군구", sortKey: "districtName" },
  { key: "roadAddress", label: "도로명주소" },
  { key: "lotAddress", label: "지번주소" },
  { key: "phoneNumber", label: "전화번호" },
  { key: "faxNumber", label: "팩스" },
  { key: "email", label: "이메일" },
  { key: "homepageUrl", label: "홈페이지" },
  { key: "representativeName", label: "대표자" },
  { key: "operatingBody", label: "운영주체" },
  { key: "operationMode", label: "운영방식" },
  { key: "foundationSubject", label: "설립주체" },
  { key: "foundationOrgDetail", label: "설립기관" },
  { key: "installationType", label: "설치유형" },
  { key: "operatingHours", label: "운영시간" },
  { key: "holidayInfo", label: "휴일" },
  { key: "hasParking", label: "주차가능" },
  { key: "capacityCount", label: "수용인원", sortKey: "capacityCount" },
  { key: "overnightCapacityCount", label: "숙박정원" },
  { key: "stayCapacityCount", label: "체류정원" },
  { key: "companionCapacityCount", label: "동반정원" },
  { key: "latitude", label: "위도" },
  { key: "longitude", label: "경도" },
  { key: "firstRegisteredDate", label: "최초등록일" },
  { key: "referenceDate", label: "기준일자" },
  { key: "isExposed", label: "노출여부" },
  { key: "remarks", label: "비고" },
];

const COUNT_OPTIONS = [100, 300, 500, "전체"] as const;
type CountOption = (typeof COUNT_OPTIONS)[number];

function cell(value: YouthFacility[keyof YouthFacility]): string {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Y" : "N";
  return String(value);
}

export function YouthFacilityTable({ facilities }: { facilities: YouthFacility[] }) {
  const [province, setProvince] = useState("전체");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("provinceName");
  const [sortAsc, setSortAsc] = useState(true);
  const [count, setCount] = useState<CountOption>(100);

  const provinces = useMemo(
    () => ["전체", ...Array.from(new Set(facilities.map((f) => f.provinceName).filter(Boolean))).sort()] as string[],
    [facilities]
  );

  const filtered = useMemo(() => {
    return facilities
      .filter((f) => province === "전체" || f.provinceName === province)
      .filter((f) => !search || f.facilityName.includes(search) || f.districtName?.includes(search));
  }, [facilities, province, search]);

  const sorted = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av ?? "").localeCompare(String(bv ?? ""));
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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="rounded-md border border-hairline bg-white px-2 py-1.5 text-ink"
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
          placeholder="시설명·시군구 검색"
          className="rounded-md border border-hairline px-3 py-1.5 text-ink outline-none focus:border-primary"
        />
        <span className="text-xs text-ink-mute">
          전체 {sorted.length.toLocaleString("ko-KR")}곳 중 {visible.length.toLocaleString("ko-KR")}곳 표시
        </span>
        <label className="ml-auto flex items-center gap-2 text-xs text-ink-mute">
          표시 개수
          <select
            value={count}
            onChange={(e) => {
              const v = e.target.value;
              setCount(v === "전체" ? "전체" : (Number(v) as CountOption));
            }}
            className="rounded-md border border-hairline bg-white px-2 py-1 text-ink"
          >
            {COUNT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "전체" ? "전체" : `${opt}개`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-canvas-cream text-left text-ink-mute">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 font-medium">#</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-2 font-medium">
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
              <tr key={f.id} className="border-t border-hairline">
                <td className="whitespace-nowrap px-3 py-2 text-ink-mute">{i + 1}</td>
                {COLUMNS.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-3 py-2">
                    {col.key === "homepageUrl" && f.homepageUrl ? (
                      <a
                        href={f.homepageUrl.trim()}
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
                <td colSpan={COLUMNS.length + 1} className="px-4 py-6 text-center text-ink-mute">
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
