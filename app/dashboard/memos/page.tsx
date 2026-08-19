import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMemos } from "@/lib/queries/memos";
import { NavIcon } from "@/components/icons/NavIcon";

const CATEGORY_LABEL: Record<string, string> = {
  keyword: "키워드",
  blog: "블로그",
  etc: "기타",
};

export default async function MemosPage() {
  const { supabase } = await requireAuthedClient();
  const memos = await getMemos(supabase);

  return (
    <main className="mx-auto flex w-[80%] flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            <NavIcon name="clipboard" className="h-5 w-5" />
            광고전략메모
          </h1>
          <p className="mt-1 text-sm text-ink-mute">키워드·블로그 운영 관련 논의와 결정을 기록합니다.</p>
        </div>
        <Link
          href="/dashboard/memos/new"
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-press"
        >
          새 메모 작성
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-canvas-cream text-left text-ink-mute">
            <tr>
              <th className="px-4 py-2 font-medium">구분</th>
              <th className="px-4 py-2 font-medium">제목</th>
              <th className="px-4 py-2 font-medium">작성자</th>
              <th className="px-4 py-2 font-medium">작성일</th>
              <th className="px-4 py-2 font-medium">댓글</th>
            </tr>
          </thead>
          <tbody>
            {memos.map((m) => (
              <tr key={m.id} className="border-t border-hairline hover:bg-canvas-cream">
                <td className="px-4 py-2 text-ink-mute">{CATEGORY_LABEL[m.category] ?? m.category}</td>
                <td className="px-4 py-2">
                  <Link href={`/dashboard/memos/${m.id}`} className="text-link-blue hover:underline">
                    {m.title}
                  </Link>
                  {m.attachmentCount > 0 && (
                    <span className="ml-2 text-xs text-ink-mute">📎{m.attachmentCount}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-ink-mute">{m.authorEmail}</td>
                <td className="px-4 py-2 text-ink-mute">
                  {new Date(m.createdAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2 text-ink-mute">{m.commentCount}</td>
              </tr>
            ))}
            {memos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-mute">
                  아직 등록된 메모가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
