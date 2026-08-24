"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WorkJournalEntry } from "@/lib/queries/workJournal";
import {
  createWorkJournalEntry,
  updateWorkJournalEntry,
  deleteWorkJournalEntry,
  deleteWorkJournalAttachment,
  getWorkJournalAttachmentUrls,
} from "@/app/dashboard/actions/workJournal";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isImage(contentType: string | null): boolean {
  return Boolean(contentType?.startsWith("image/"));
}

function EntryForm({
  entry,
  members,
  onDone,
}: {
  entry: WorkJournalEntry | null;
  members: string[];
  onDone: () => void;
}) {
  const action = entry ? updateWorkJournalEntry.bind(null, entry.id) : createWorkJournalEntry;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-sm border border-hairline bg-canvas-cream p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          작성자 *
          <select
            name="authorName"
            required
            defaultValue={entry?.authorName ?? ""}
            className="rounded-sm border border-hairline bg-canvas-cream px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="" disabled>
              선택
            </option>
            {members.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          주차 라벨
          <input
            name="weekLabel"
            defaultValue={entry?.weekLabel ?? ""}
            placeholder="예: 26년 02월 1~2주차"
            className="rounded-sm border border-hairline bg-canvas-cream px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-mute">
          날짜
          <input
            name="entryDate"
            type="date"
            defaultValue={entry?.entryDate ?? ""}
            className="rounded-sm border border-hairline bg-canvas-cream px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-ink-mute">
        내용 *
        <textarea
          name="content"
          required
          rows={8}
          defaultValue={entry?.content ?? ""}
          className="rounded-sm border border-hairline bg-canvas-cream px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-mute">
        파일첨부
        <input
          name="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          className="rounded-sm border border-hairline bg-canvas-cream px-3 py-1.5 text-sm text-ink outline-none file:mr-3 file:rounded file:border-0 file:bg-background file:px-3 file:py-1 file:text-sm"
        />
        <span>이미지·PDF·Office 문서·ZIP, 파일당 12MB 이하, 최대 5개</span>
      </label>
      {entry && entry.attachments.length > 0 && (
        <p className="text-xs text-ink-mute">
          기존 첨부파일은 상세 화면에서 개별적으로 삭제할 수 있습니다.
        </p>
      )}
      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "저장 중..." : entry ? "수정 저장" : "일지 추가"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function AttachmentList({ entry }: { entry: WorkJournalEntry }) {
  const [urls, setUrls] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function load() {
    if (urls || loading) return;
    setLoading(true);
    const result = await getWorkJournalAttachmentUrls(entry.attachments.map((a) => a.storagePath));
    setUrls(result);
    setLoading(false);
  }

  function handleDelete(attachmentId: string) {
    if (!window.confirm("이 첨부파일을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteWorkJournalAttachment(attachmentId);
      router.refresh();
    });
  }

  if (entry.attachments.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={load}
        className="w-fit text-xs text-link-blue hover:underline"
      >
        {loading ? "불러오는 중..." : urls ? `첨부파일 ${entry.attachments.length}개` : `첨부파일 ${entry.attachments.length}개 보기`}
      </button>
      {urls && (
        <div className="flex flex-wrap gap-2">
          {entry.attachments.map((a) => {
            const url = urls[a.storagePath];
            return (
              <div key={a.id} className="flex items-center gap-1.5 rounded-sm border border-hairline bg-background px-2 py-1.5 text-xs">
                {url ? (
                  isImage(a.contentType) ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={a.fileName} className="h-8 w-8 rounded object-cover" />
                      <span className="max-w-32 truncate text-ink">{a.fileName}</span>
                    </a>
                  ) : (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="max-w-40 truncate text-link-blue hover:underline">
                      📎 {a.fileName}
                    </a>
                  )
                ) : (
                  <span className="max-w-40 truncate text-ink-mute">{a.fileName}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="text-semantic-error hover:underline"
                  aria-label="첨부파일 삭제"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  onEdit,
}: {
  entry: WorkJournalEntry;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const firstLine = entry.content.split("\n").find((l) => l.trim()) ?? "";

  function handleDelete() {
    if (!window.confirm("이 업무일지 항목을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteWorkJournalEntry(entry.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-sm border border-hairline bg-canvas-cream p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-mute">
            <span className="rounded-full bg-canvas-lavender px-2 py-0.5 font-medium text-primary">
              {entry.authorName}
            </span>
            {entry.weekLabel && <span>{entry.weekLabel}</span>}
            {entry.entryDate && <span>{formatDate(entry.entryDate)}</span>}
            {entry.attachments.length > 0 && <span>📎 {entry.attachments.length}</span>}
          </div>
          <p className={`mt-1 text-sm text-ink ${expanded ? "whitespace-pre-wrap" : "truncate"}`}>
            {expanded ? entry.content : firstLine}
          </p>
        </div>
        <span className="shrink-0 text-xs text-ink-mute">{expanded ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {expanded && (
        <>
          <AttachmentList entry={entry} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-hairline px-3 py-1 text-xs font-medium text-ink hover:bg-[#f7f7f8]"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-hairline px-3 py-1 text-xs font-medium text-semantic-error hover:bg-[#f7f7f8]"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function WorkJournalBoard({ entries, members }: { entries: WorkJournalEntry[]; members: string[] }) {
  const [authorFilter, setAuthorFilter] = useState("전체");
  const [editingId, setEditingId] = useState<string | null | "new">(null);

  const authors = useMemo(() => {
    const set = new Set([...members, ...entries.map((e) => e.authorName)]);
    return ["전체", ...Array.from(set).sort()];
  }, [members, entries]);

  const filtered = useMemo(
    () => (authorFilter === "전체" ? entries : entries.filter((e) => e.authorName === authorFilter)),
    [entries, authorFilter]
  );

  const editingEntry = editingId && editingId !== "new" ? (entries.find((e) => e.id === editingId) ?? null) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {authors.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAuthorFilter(a)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                authorFilter === a ? "bg-primary text-white" : "bg-canvas-cream text-ink-mute hover:text-ink"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEditingId("new")}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-press"
        >
          + 새 일지 추가
        </button>
      </div>

      {editingId === "new" && <EntryForm entry={null} members={members} onDone={() => setEditingId(null)} />}
      {editingEntry && (
        <EntryForm entry={editingEntry} members={members} onDone={() => setEditingId(null)} />
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((e) => (
          <EntryCard key={e.id} entry={e} onEdit={() => setEditingId(e.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-sm border border-hairline bg-canvas-cream p-6 text-center text-sm text-ink-mute">
            등록된 업무일지가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
