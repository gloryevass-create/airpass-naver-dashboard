import type { HotKeyword } from "@/lib/newsKeywordFrequency";
import { NavIcon } from "@/components/icons/NavIcon";

function sizeClass(rank: number): string {
  if (rank < 3) return "text-base font-bold";
  if (rank < 7) return "text-sm font-semibold";
  return "text-xs font-medium";
}

export function NewsHotKeywords({ keywords }: { keywords: HotKeyword[] }) {
  return (
    <div className="rounded-sm border border-hairline bg-canvas-cream p-4">
      <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
        <NavIcon name="sparkle" className="h-4 w-4" />
        AI 분석 핫 키워드
      </h2>
      <p className="mb-3 text-xs text-ink-mute">
        조회 기간에 수집된 뉴스 제목에서 자주 등장한 단어를 빈도순으로 뽑았습니다.
      </p>
      {keywords.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-mute">
          이번 조회 기간에는 반복 등장한 키워드가 충분하지 않습니다.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {keywords.map((k, i) => (
            <span
              key={k.term}
              className={`flex items-center gap-1 rounded-full bg-canvas-lavender px-3 py-1 text-primary ${sizeClass(i)}`}
            >
              {k.term}
              <span className="text-ink-mute">{k.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
