"use client";

import { useMemo, useState } from "react";
import type { PrespecNotice } from "@/lib/queries/prespec";

const BUSINESS_TYPE_LABEL: Record<PrespecNotice["businessType"], string> = {
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

export function PrespecNoticeList({
  notices,
  registeredKeywords,
}: {
  notices: PrespecNotice[];
  registeredKeywords: string[];
}) {
  // 등록된 키워드는 이번 조회 기간에 매칭된 사전규격이 0건이어도 항상 탭에 보여야 한다 —
  // budget_bids와 동일한 이유(BudgetBidList 참고).
  const keywords = useMemo(() => {
    const set = new Set([...registeredKeywords, ...notices.map((n) => n.keyword)]);
    return ["전체", ...Array.from(set).sort()];
  }, [registeredKeywords, notices]);
  const [filter, setFilter] = useState("전체");

  const filtered = filter === "전체" ? notices : notices.filter((n) => n.keyword === filter);

  if (keywords.length <= 1) {
    return (
      <div className="rounded-xl border border-hairline p-6 text-center text-sm text-ink-mute">
        등록된 검색 키워드가 없습니다. 공고 모니터링(/dashboard/budget)에서 키워드를 추가해
        주세요 — 같은 키워드 목록을 사전규격 검색에도 씁니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === k ? "bg-primary text-white" : "bg-canvas-cream text-ink-mute hover:text-ink"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="bg-canvas-cream text-left text-ink-mute">
            <tr>
              <th className="px-4 py-2 font-medium">키워드</th>
              <th className="px-4 py-2 font-medium">구분</th>
              <th className="px-4 py-2 font-medium">사업명</th>
              <th className="px-4 py-2 font-medium">발주기관</th>
              <th className="px-4 py-2 font-medium">배정예산</th>
              <th className="px-4 py-2 font-medium">등록일</th>
              <th className="px-4 py-2 font-medium">의견마감일</th>
              <th className="px-4 py-2 font-medium">담당자</th>
              <th className="px-4 py-2 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => (
              <tr key={n.id} className="border-t border-hairline">
                <td className="px-4 py-2">
                  <span className="rounded-full bg-canvas-lavender px-2 py-0.5 text-xs font-medium text-primary">
                    {n.keyword}
                  </span>
                </td>
                <td className="px-4 py-2 text-ink-mute">{BUSINESS_TYPE_LABEL[n.businessType]}</td>
                <td className="px-4 py-2 whitespace-normal">
                  {n.specDocUrls[0] ? (
                    <a
                      href={n.specDocUrls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link-blue hover:underline"
                    >
                      {n.title}
                    </a>
                  ) : (
                    n.title
                  )}
                </td>
                <td className="px-4 py-2 text-ink-mute">{n.noticeInst ?? "-"}</td>
                <td className="px-4 py-2">{formatWon(n.budgetAmount)}</td>
                <td className="px-4 py-2 text-ink-mute">{formatDate(n.registeredAt)}</td>
                <td className="px-4 py-2 text-ink-mute">{formatDate(n.opinionCloseAt)}</td>
                <td className="px-4 py-2 text-ink-mute">
                  {n.officialName ?? "-"}
                  {n.officialTel && <span className="ml-1">({n.officialTel})</span>}
                </td>
                <td className="px-4 py-2">
                  {n.bidNoticeNos.length > 0 ? (
                    <span className="rounded-full bg-semantic-success/15 px-2 py-0.5 text-xs font-medium text-semantic-success">
                      입찰공고 전환됨
                    </span>
                  ) : (
                    <span className="text-xs text-ink-mute">의견수렴 중</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-ink-mute">
                  {filter === "전체"
                    ? "선택한 기간에 수집된 사전규격이 없습니다."
                    : `"${filter}" 키워드로 수집된 사전규격이 없습니다(다음 자동 수집 때 다시 시도합니다).`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
