"use client";

import { useActionState, useMemo, useState } from "react";
import type { DriveMaterialFile } from "@/lib/googleDriveMaterials";
import { sendMaterialEmailAction, type SendMaterialEmailState } from "@/app/dashboard/actions/materialEmail";

const initialState: SendMaterialEmailState = undefined;

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function MaterialEmailForm({ files }: { files: DriveMaterialFile[] }) {
  const [state, formAction, pending] = useActionState(sendMaterialEmailAction, initialState);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      action={formAction}
      onSubmit={() => {
        // 성공 시 새 발송을 위해 선택 상태를 비운다(실패 시에는 재시도하기 편하게 유지).
        if (state?.success) setSelected(new Set());
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="recipients" className="text-sm font-medium text-ink">
          받는 사람 이메일 (쉼표 또는 줄바꿈으로 여러 명 입력)
        </label>
        <textarea
          id="recipients"
          name="recipients"
          required
          rows={2}
          placeholder="example@company.com, another@company.com"
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium text-ink">
          제목
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium text-ink">
          안내 내용
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="보내드리는 자료에 대한 안내 문구를 입력하세요."
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">
            보낼 자료 선택 {selected.size > 0 && `(${selected.size}개 선택됨)`}
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="자료명 검색"
            className="w-48 rounded border border-hairline px-2 py-1 text-xs text-ink outline-none focus:border-primary"
          />
        </div>
        <div className="max-h-72 overflow-auto rounded-sm border border-hairline">
          {filtered.length === 0 && (
            <p className="p-4 text-center text-sm text-ink-mute">
              {files.length === 0 ? "자료 폴더가 비어 있습니다." : "검색 결과가 없습니다."}
            </p>
          )}
          {filtered.map((f) => (
            <label
              key={f.id}
              className={`flex cursor-pointer items-center gap-3 border-b border-hairline px-3 py-2 text-sm last:border-b-0 hover:bg-canvas-lavender/20 ${
                selected.has(f.id) ? "bg-canvas-lavender/30" : ""
              }`}
            >
              <input
                type="checkbox"
                name="fileIds"
                value={f.id}
                checked={selected.has(f.id)}
                onChange={() => toggle(f.id)}
                className="h-3.5 w-3.5 shrink-0"
              />
              {f.iconLink && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.iconLink} alt="" className="h-4 w-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate text-ink" title={f.name}>
                {f.name}
              </span>
              <span className="shrink-0 text-xs text-ink-mute">{formatFileSize(f.sizeBytes)}</span>
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-semantic-success">메일을 발송했습니다.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "발송 중..." : "보내기"}
      </button>
    </form>
  );
}
