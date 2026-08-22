import { NavIcon } from "@/components/icons/NavIcon";

export function AiKeywordStrategyComment({ comment }: { comment: string | null }) {
  if (!comment) return null;

  return (
    <div className="rounded-sm border border-hairline bg-canvas-cream p-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
        <NavIcon name="sparkle" className="h-4 w-4" />
        AI 키워드 전략 코멘트
      </h2>
      <p className="text-sm leading-relaxed text-ink">{comment}</p>
    </div>
  );
}
