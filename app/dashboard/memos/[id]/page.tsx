import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { getMemoDetail } from "@/lib/queries/memos";
import { MemoCommentForm } from "@/components/MemoCommentForm";
import { DeleteMemoButton } from "@/components/DeleteMemoButton";
import { deleteMemo } from "@/app/dashboard/memos/actions";
import { NavIcon } from "@/components/icons/NavIcon";

const CATEGORY_LABEL: Record<string, string> = {
  keyword: "키워드",
  blog: "블로그",
  etc: "기타",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

type Params = Promise<{ id: string }>;

export default async function MemoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const { supabase, user } = await requireAuthedClient();
  const memo = await getMemoDetail(supabase, id);

  if (!memo) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const canModify = memo.authorId === user.id || profile?.role === "admin";

  const attachmentsWithUrl = await Promise.all(
    memo.attachments.map(async (a) => {
      const { data } = await supabase.storage
        .from("memo-attachments")
        .createSignedUrl(a.storagePath, 60 * 60);
      return { ...a, url: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Link
        href="/dashboard/memos"
        className="flex w-fit items-center gap-1 text-sm text-ink-mute hover:text-ink"
      >
        ← 목록으로
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-canvas-lavender px-3 py-1 text-xs font-medium text-primary">
            {CATEGORY_LABEL[memo.category] ?? memo.category}
          </span>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-primary">{memo.title}</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {memo.authorEmail} · {formatDate(memo.createdAt)}
          </p>
        </div>
        {canModify && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/dashboard/memos/${memo.id}/edit`}
              className="rounded-lg border border-hairline px-4 py-1.5 text-sm font-medium text-ink hover:bg-canvas-cream"
            >
              수정
            </Link>
            <DeleteMemoButton action={deleteMemo.bind(null, memo.id)} />
          </div>
        )}
      </div>

      <div className="whitespace-pre-wrap rounded-sm border border-hairline p-4 text-sm text-ink">
        {memo.content}
      </div>

      {attachmentsWithUrl.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
            <NavIcon name="paperclip" className="h-4 w-4" />
            첨부파일
          </h2>
          <ul className="flex flex-col gap-1">
            {attachmentsWithUrl.map((a) => (
              <li key={a.id} className="text-sm">
                {a.url ? (
                  <a href={a.url} className="text-link-blue hover:underline">
                    📎 {a.fileName}
                  </a>
                ) : (
                  <span className="text-ink-mute">📎 {a.fileName}</span>
                )}
                <span className="ml-2 text-xs text-ink-mute">{formatFileSize(a.fileSize)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-mute">
          <NavIcon name="chat" className="h-4 w-4" />
          댓글 {memo.comments.length > 0 && `(${memo.comments.length})`}
        </h2>
        <ul className="mb-4 flex flex-col gap-3">
          {memo.comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-hairline p-3 text-sm">
              <p className="mb-1 text-xs text-ink-mute">
                {c.authorEmail} · {formatDate(c.createdAt)}
              </p>
              <p className="whitespace-pre-wrap text-ink">{c.content}</p>
            </li>
          ))}
          {memo.comments.length === 0 && (
            <li className="text-sm text-ink-mute">아직 댓글이 없습니다.</li>
          )}
        </ul>
        <MemoCommentForm memoId={memo.id} />
      </div>
    </main>
  );
}
