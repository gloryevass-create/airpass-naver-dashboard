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

export function NewsList({ articles }: { articles: NewsArticle[] }) {
  const keywords = useMemo(() => {
    const set = new Set(articles.map((a) => a.keyword));
    return ["전체", ...Array.from(set)];
  }, [articles]);
  const [filter, setFilter] = useState("전체");

  const filtered = filter === "전체" ? articles : articles.filter((a) => a.keyword === filter);

  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-hairline p-6 text-center text-sm text-ink-mute">
        아직 수집된 뉴스가 없습니다.
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
          <li className="py-6 text-center text-sm text-ink-mute">해당 키워드의 뉴스가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
