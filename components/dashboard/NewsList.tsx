"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { NewsArticle } from "@/lib/queries/news";
import { NavIcon } from "@/components/icons/NavIcon";
import { scrapNotices, unscrapNotices } from "@/app/dashboard/actions/scraps";

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

function NewsActions({
  article,
  isScraped,
  onToggleScrap,
}: {
  article: NewsArticle;
  isScraped: boolean;
  onToggleScrap: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(text: string) {
    setMessage(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(null), 2000);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(article.link);
      flash("링크 복사됨");
    } catch {
      flash("복사 실패");
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url: article.link });
      } catch {
        // 사용자가 공유 시트를 취소한 경우도 여기로 온다 — 별도 에러 처리 불필요.
      }
      return;
    }
    // Web Share API 미지원 브라우저(대부분의 데스크톱 Chrome 등)에서는 링크 복사로 대체한다.
    try {
      await navigator.clipboard.writeText(article.link);
      flash("공유 미지원 브라우저 — 링크를 복사했습니다");
    } catch {
      flash("공유 실패");
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        onClick={onToggleScrap}
        className={`flex items-center gap-1 text-xs ${
          isScraped ? "text-primary" : "text-ink-mute hover:text-primary"
        }`}
      >
        <NavIcon name="tag" className="h-3.5 w-3.5" />
        {isScraped ? "스크랩됨" : "스크랩"}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 text-xs text-ink-mute hover:text-primary"
      >
        <NavIcon name="link" className="h-3.5 w-3.5" />
        링크 복사
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1 text-xs text-ink-mute hover:text-primary"
      >
        <NavIcon name="share" className="h-3.5 w-3.5" />
        공유
      </button>
      {message && <span className="text-xs text-semantic-success">{message}</span>}
    </div>
  );
}

export function NewsList({
  articles,
  registeredKeywords,
  scrapedIds: initialScrapedIds,
}: {
  articles: NewsArticle[];
  registeredKeywords: string[];
  scrapedIds: Set<string>;
}) {
  // 등록된 키워드는 이번 조회 기간에 매칭된 기사가 0건이어도 항상 탭에 보여야 한다 —
  // 그렇지 않으면 "키워드를 등록했는데 화면에 아무 흔적이 없다"는 혼란이 생긴다. 데이터에만
  // 있고 목록에서 삭제된 키워드도(과거 기록이니) 계속 보여준다.
  const keywords = useMemo(() => {
    const set = new Set([...registeredKeywords, ...articles.map((a) => a.keyword)]);
    return ["전체", ...Array.from(set).sort()];
  }, [registeredKeywords, articles]);
  const [filter, setFilter] = useState("전체");
  const [view, setView] = useState<"all" | "scrap">("all");
  const [scrapedIds, setScrapedIds] = useState(initialScrapedIds);
  const [, startTransition] = useTransition();

  function toggleScrap(id: string) {
    const isScraped = scrapedIds.has(id);
    setScrapedIds((prev) => {
      const next = new Set(prev);
      if (isScraped) next.delete(id);
      else next.add(id);
      return next;
    });
    startTransition(async () => {
      if (isScraped) await unscrapNotices("news", [id], "/dashboard/news");
      else await scrapNotices("news", [id], "/dashboard/news");
    });
  }

  const byKeyword = filter === "전체" ? articles : articles.filter((a) => a.keyword === filter);
  const filtered = view === "scrap" ? byKeyword.filter((a) => scrapedIds.has(a.id)) : byKeyword;

  if (keywords.length <= 1) {
    return (
      <div className="rounded-sm border border-hairline bg-canvas-cream p-6 text-center text-sm text-ink-mute">
        등록된 검색 키워드가 없습니다. 위에서 키워드를 추가해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                filter === k
                  ? "bg-primary text-white"
                  : "bg-canvas-cream text-ink-mute hover:text-ink"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("all")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              view === "all" ? "bg-primary text-white" : "bg-canvas-cream text-ink-mute hover:text-ink"
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setView("scrap")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              view === "scrap" ? "bg-primary text-white" : "bg-canvas-cream text-ink-mute hover:text-ink"
            }`}
          >
            스크랩 ({scrapedIds.size})
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {filtered.map((a) => (
          <li
            key={a.id}
            className={`rounded-sm border p-4 ${
              scrapedIds.has(a.id) ? "border-primary/40 bg-canvas-lavender/20" : "border-hairline"
            }`}
          >
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
              {scrapedIds.has(a.id) && <span className="mr-1 text-primary">★</span>}
              {a.title}
            </a>
            {a.description && (
              <p className="mt-1 text-xs text-ink-mute">{a.description}</p>
            )}
            <NewsActions article={a} isScraped={scrapedIds.has(a.id)} onToggleScrap={() => toggleScrap(a.id)} />
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-mute">
            {view === "scrap"
              ? "스크랩한 뉴스가 없습니다."
              : filter === "전체"
                ? "선택한 기간에 수집된 뉴스가 없습니다."
                : `"${filter}" 키워드로 수집된 뉴스가 없습니다(다음 자동 수집 때 다시 시도합니다).`}
          </li>
        )}
      </ul>
    </div>
  );
}
