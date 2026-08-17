"use client";

import { useMemo, useState } from "react";
import type { NewsArticle } from "@/lib/queries/news";

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceDomain(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function NewsList({
  articles,
  registeredKeywords,
}: {
  articles: NewsArticle[];
  registeredKeywords: string[];
}) {
  // 등록된 키워드는 이번 조회 기간에 매칭된 기사가 0건이어도 항상 탭에 보여야 한다 —
  // 그렇지 않으면 "키워드를 등록했는데 화면에 아무 흔적이 없다"는 혼란이 생긴다. 데이터에만
  // 있고 목록에서 삭제된 키워드도(과거 기록이니) 계속 보여준다.
  const keywords = useMemo(() => {
    const set = new Set([...registeredKeywords, ...articles.map((a) => a.keyword)]);
    return ["전체", ...Array.from(set).sort()];
  }, [registeredKeywords, articles]);
  const [filter, setFilter] = useState("전체");

  const filtered = filter === "전체" ? articles : articles.filter((a) => a.keyword === filter);

  if (keywords.length <= 1) {
    return (
      <div className="rounded-xl border border-hairline p-6 text-center text-sm text-ink-mute">
        등록된 검색 키워드가 없습니다. 위에서 키워드를 추가해 주세요.
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
              filter === k
                ? "bg-primary text-white"
                : "bg-canvas-cream text-ink-mute hover:text-ink"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {filtered.map((a) => (
          <li key={a.id} className="rounded-xl border border-hairline p-4">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-mute">
              <span className="rounded-full bg-canvas-lavender px-2 py-0.5 font-medium text-primary">
                {a.keyword}
              </span>
              <span>{sourceDomain(a.link)}</span>
              <span>·</span>
              <span>{formatDate(a.publishedAt)}</span>
            </div>
            <a
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink hover:text-primary hover:underline"
            >
              {a.title}
            </a>
            {a.description && (
              <p className="mt-1 text-xs text-ink-mute">{a.description}</p>
            )}
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-mute">
            {filter === "전체"
              ? "선택한 기간에 수집된 뉴스가 없습니다."
              : `"${filter}" 키워드로 수집된 뉴스가 없습니다(다음 자동 수집 때 다시 시도합니다).`}
          </li>
        )}
      </ul>
    </div>
  );
}
