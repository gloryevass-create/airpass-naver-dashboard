"use client";

import { useMemo, useState } from "react";
import type { YoutubeVideo } from "@/lib/queries/youtube";

type SortKey = "title" | "publishedAt" | "viewCount" | "likeCount" | "commentCount";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "title", label: "제목" },
  { key: "publishedAt", label: "게시일" },
  { key: "viewCount", label: "조회수" },
  { key: "likeCount", label: "좋아요" },
  { key: "commentCount", label: "댓글수" },
];

function sortValue(row: YoutubeVideo, key: SortKey): string | number {
  switch (key) {
    case "title":
      return row.title;
    case "publishedAt":
      return row.publishedAt ?? "";
    case "viewCount":
      return row.viewCount;
    case "likeCount":
      return row.likeCount;
    case "commentCount":
      return row.commentCount;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function YoutubeVideoTable({ videos }: { videos: YoutubeVideo[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("viewCount");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return videos.slice().sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : av - (bv as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [videos, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-sm border border-hairline bg-canvas-cream p-6 text-center text-sm text-ink-mute">
        아직 수집된 영상이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-hairline bg-canvas-cream">
      <table className="w-full whitespace-nowrap text-sm">
        <thead className="bg-[#f7f7f8] text-left text-ink-mute">
          <tr>
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">썸네일</th>
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
            <th className="px-4 py-2 font-medium">길이</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((v, i) => (
            <tr key={v.id} className="border-t border-hairline odd:bg-white even:bg-[#f7f7f8]">
              <td className="px-4 py-2 text-ink-mute">{i + 1}</td>
              <td className="px-4 py-2">
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnailUrl} alt="" className="h-10 w-16 rounded object-cover" />
                )}
              </td>
              <td className="max-w-xs px-4 py-2 whitespace-normal">
                <a
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link-blue hover:underline"
                >
                  {v.title}
                </a>
              </td>
              <td className="px-4 py-2 text-ink-mute">{formatDate(v.publishedAt)}</td>
              <td className="px-4 py-2">{v.viewCount.toLocaleString("ko-KR")}</td>
              <td className="px-4 py-2">{v.likeCount.toLocaleString("ko-KR")}</td>
              <td className="px-4 py-2">{v.commentCount.toLocaleString("ko-KR")}</td>
              <td className="px-4 py-2 text-ink-mute">{formatDuration(v.durationSeconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
