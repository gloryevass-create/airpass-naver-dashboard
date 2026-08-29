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
      <div className="text-muted" style={{ border: "1px solid var(--color-divider)", padding: "var(--space-6)", textAlign: "center", fontSize: 13 }}>
        아직 수집된 영상이 없습니다.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--color-divider)" }}>
      <table className="table" style={{ whiteSpace: "nowrap" }}>
        <thead>
          <tr>
            <th>#</th>
            <th>썸네일</th>
            {COLUMNS.map((col) => (
              <th key={col.key}>
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", cursor: "pointer" }}
                >
                  {col.label}
                  {sortKey === col.key && <span>{sortAsc ? "▲" : "▼"}</span>}
                </button>
              </th>
            ))}
            <th>길이</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((v, i) => (
            <tr key={v.id}>
              <td className="text-muted">{i + 1}</td>
              <td>
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnailUrl} alt="" style={{ height: 40, width: 64, objectFit: "cover" }} />
                )}
              </td>
              <td style={{ maxWidth: 320, whiteSpace: "normal" }}>
                <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer">
                  {v.title}
                </a>
              </td>
              <td className="text-muted">{formatDate(v.publishedAt)}</td>
              <td>{v.viewCount.toLocaleString("ko-KR")}</td>
              <td>{v.likeCount.toLocaleString("ko-KR")}</td>
              <td>{v.commentCount.toLocaleString("ko-KR")}</td>
              <td className="text-muted">{formatDuration(v.durationSeconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
