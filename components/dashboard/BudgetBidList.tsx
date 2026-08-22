"use client";

import { useMemo, useState } from "react";
import type { BudgetBid } from "@/lib/queries/budget";
import { useScrapToolbar } from "@/lib/hooks/useScrapToolbar";

const BUSINESS_TYPE_LABEL: Record<BudgetBid["businessType"], string> = {
  cnstwk: "공사",
  servc: "용역",
  thng: "물품",
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatWon(amount: number | null) {
  if (amount == null) return "-";
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export function BudgetBidList({
  bids,
  registeredKeywords,
  scrapedIds,
  path,
}: {
  bids: BudgetBid[];
  registeredKeywords: string[];
  scrapedIds: Set<string>;
  path: string;
}) {
  // 등록된 키워드는 이번 조회 기간에 매칭된 공고가 0건이어도 항상 탭에 보여야 한다 —
  // 그렇지 않으면 "키워드를 등록했는데 화면에 아무 흔적이 없다"는 혼란이 생긴다. 데이터에만
  // 있고 목록에서 삭제된 키워드도(과거 기록이니) 계속 보여준다.
  const keywords = useMemo(() => {
    const set = new Set([...registeredKeywords, ...bids.map((b) => b.keyword)]);
    return ["전체", ...Array.from(set).sort()];
  }, [registeredKeywords, bids]);
  const [filter, setFilter] = useState("전체");
  const scrap = useScrapToolbar("budget", path);

  const filtered = useMemo(() => {
    let list = filter === "전체" ? bids : bids.filter((b) => b.keyword === filter);
    if (scrap.view === "scrap") list = list.filter((b) => scrapedIds.has(b.id));
    return list;
  }, [bids, filter, scrap.view, scrapedIds]);

  if (keywords.length <= 1) {
    return (
      <div className="rounded-sm border border-hairline p-6 text-center text-sm text-ink-mute">
        등록된 검색 키워드가 없습니다. 위에서 키워드를 추가해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                filter === k ? "bg-primary text-white" : "bg-canvas-cream text-ink-mute hover:text-ink"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-canvas-cream p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => scrap.switchView("all")}
              className={`rounded-lg px-3 py-1 transition-colors ${
                scrap.view === "all" ? "bg-primary text-white shadow-sm" : "text-ink-mute hover:text-ink"
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => scrap.switchView("scrap")}
              className={`rounded-lg px-3 py-1 transition-colors ${
                scrap.view === "scrap" ? "bg-primary text-white shadow-sm" : "text-ink-mute hover:text-ink"
              }`}
            >
              스크랩 ({scrapedIds.size})
            </button>
          </div>
          {scrap.selected.size > 0 &&
            (scrap.view === "all" ? (
              <button
                type="button"
                onClick={scrap.scrapSelected}
                disabled={scrap.pending}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
              >
                선택한 {scrap.selected.size}건 스크랩
              </button>
            ) : (
              <button
                type="button"
                onClick={scrap.unscrapSelected}
                disabled={scrap.pending}
                className="rounded-lg bg-canvas-cream px-4 py-1.5 text-xs font-bold text-ink hover:bg-hairline disabled:opacity-50"
              >
                선택한 {scrap.selected.size}건 스크랩 해제
              </button>
            ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-hairline">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="bg-[#f7f7f8] text-left text-ink-mute">
            <tr>
              <th className="w-8 px-4 py-2">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((b) => scrap.selected.has(b.id))}
                  onChange={() => scrap.toggleAll(filtered.map((b) => b.id))}
                  aria-label="전체 선택"
                />
              </th>
              <th className="px-4 py-2 font-medium">키워드</th>
              <th className="px-4 py-2 font-medium">구분</th>
              <th className="px-4 py-2 font-medium">사업명</th>
              <th className="px-4 py-2 font-medium">발주기관</th>
              <th className="px-4 py-2 font-medium">예산금액</th>
              <th className="px-4 py-2 font-medium">공고일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr
                key={b.id}
                className={`border-t border-hairline ${scrapedIds.has(b.id) ? "bg-canvas-lavender/20" : "odd:bg-white even:bg-[#f7f7f8]"}`}
              >
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={scrap.selected.has(b.id)}
                    onChange={() => scrap.toggle(b.id)}
                    aria-label={`${b.title} 선택`}
                  />
                </td>
                <td className="px-4 py-2">
                  <span className="rounded-full bg-canvas-lavender px-2 py-0.5 text-xs font-medium text-primary">
                    {b.keyword}
                  </span>
                </td>
                <td className="px-4 py-2 text-ink-mute">{BUSINESS_TYPE_LABEL[b.businessType]}</td>
                <td className="px-4 py-2 whitespace-normal">
                  {scrapedIds.has(b.id) && <span className="mr-1 text-primary">★</span>}
                  {b.detailUrl ? (
                    <a
                      href={b.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link-blue hover:underline"
                    >
                      {b.title}
                    </a>
                  ) : (
                    b.title
                  )}
                </td>
                <td className="px-4 py-2 text-ink-mute">{b.noticeInst ?? "-"}</td>
                <td className="px-4 py-2">
                  {formatWon(b.budgetAmount ?? b.presmptPrice)}
                  {b.budgetAmount == null && b.presmptPrice != null && (
                    <span className="ml-1 text-xs text-ink-mute">(추정가격)</span>
                  )}
                </td>
                <td className="px-4 py-2 text-ink-mute">{formatDate(b.noticeDate)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-mute">
                  {scrap.view === "scrap"
                    ? "스크랩한 공고가 없습니다."
                    : filter === "전체"
                      ? "선택한 기간에 수집된 입찰공고가 없습니다."
                      : `"${filter}" 키워드로 수집된 입찰공고가 없습니다(다음 자동 수집 때 다시 시도합니다).`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
