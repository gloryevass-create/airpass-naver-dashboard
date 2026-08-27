"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { DriveMaterialFile } from "@/lib/googleDriveMaterials";
import type { QuotationSummary } from "@/lib/queries/quotations";
import { sendMaterialEmailAction, type SendMaterialEmailState } from "@/app/dashboard/actions/materialEmail";
import { AI_MATERIAL_EMAIL_DRAFT_KEY, type AiMaterialEmailDraft } from "@/lib/aiMaterialEmailDraft";
import { DEFAULT_MATERIAL_EMAIL_SUBJECT, DEFAULT_MATERIAL_EMAIL_MESSAGE } from "@/lib/materialEmailDefaults";
import { buildMaterialEmailHtml } from "@/lib/materialEmailTemplate";

const initialState: SendMaterialEmailState = undefined;

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function isVideoFile(f: DriveMaterialFile): boolean {
  return f.mimeType.startsWith("video/");
}

function FileGroup({
  title,
  files,
  selected,
  onToggle,
  onToggleAll,
}: {
  title: string;
  files: DriveMaterialFile[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (files: DriveMaterialFile[], selectAll: boolean) => void;
}) {
  const allSelected = files.length > 0 && files.every((f) => selected.has(f.id));

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 bg-background px-3 py-1.5 text-xs font-semibold text-ink-mute">
        <input
          type="checkbox"
          checked={allSelected}
          disabled={files.length === 0}
          onChange={() => onToggleAll(files, !allSelected)}
          className="h-3.5 w-3.5 shrink-0"
        />
        {title} ({files.length}) 전체 선택
      </label>
      {files.length === 0 && <p className="px-3 py-3 text-center text-sm text-ink-mute">해당 없음</p>}
      {files.map((f) => (
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
            onChange={() => onToggle(f.id)}
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
  );
}

/** 산출내역(견적) 첨부 검색 — 물품/사업 검색과 같은 알약형 버튼 + 드롭다운
 * 디자인으로 통일한다(사용자 확인, 2026-08-28). 산출내역은 최대 1건만 첨부한다
 * (템플릿에 "견적서 원본 PDF" 자리가 하나뿐이라 단일 선택). */
function QuotationPicker({
  quotations,
  value,
  onChange,
}: {
  quotations: QuotationSummary[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = quotations.find((q) => q.id === value) ?? null;

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter(
      (item) =>
        item.quoteNumber.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        (item.projectTitle ?? "").toLowerCase().includes(q)
    );
  }, [quotations, search]);

  return (
    <div ref={panelRef} className="relative flex flex-col gap-1">
      <span className="text-sm font-medium text-ink">산출내역(견적) 첨부 — 선택 안 함</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-full border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-canvas-lavender/40"
        >
          🔍 <span className="truncate">{selected ? `${selected.quoteNumber} · ${selected.customerName}` : `산출내역 검색 (${quotations.length}건)`}</span>
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="첨부 해제"
            className="shrink-0 text-ink-mute hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-sm border border-hairline bg-canvas-cream text-left shadow-lg">
          <div className="sticky top-0 flex items-center gap-2 border-b border-hairline bg-canvas-cream px-3 py-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="기관명·산출번호로 검색"
              className="min-w-0 flex-1 rounded-sm border border-hairline bg-background px-2 py-1 text-xs text-ink outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary-press"
            >
              선택 완료
            </button>
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-ink-mute">검색 결과가 없습니다.</p>
          ) : (
            filtered.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  onChange(q.id);
                  setSearch("");
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 border-t border-hairline px-3 py-1.5 text-left first:border-t-0 hover:bg-canvas-lavender/30 ${
                  q.id === value ? "bg-canvas-lavender/20" : ""
                }`}
              >
                <span className="min-w-0 truncate text-xs font-bold text-ink">
                  {q.quoteNumber} · {q.customerName}
                </span>
                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-ink-mute">
                  {q.status === "final" ? "최종" : "임시"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function MaterialEmailForm({
  files,
  quotations,
  productLinkLabels,
  senderName,
  senderTitle,
  senderEmail,
}: {
  files: DriveMaterialFile[];
  quotations: QuotationSummary[];
  productLinkLabels: { label: string; matched: boolean }[];
  senderName: string;
  senderTitle: string | null;
  senderEmail: string;
}) {
  const [state, formAction, pending] = useActionState(sendMaterialEmailAction, initialState);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(files.map((f) => f.id)));
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState(DEFAULT_MATERIAL_EMAIL_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MATERIAL_EMAIL_MESSAGE);
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // AI 명령 입력창에서 넘어온 초안이 있으면 채워 넣는다(자동 발송은 하지 않고
  // 항상 이 화면에서 사람이 확인 후 직접 "보내기"를 눌러야 한다). sessionStorage는
  // 브라우저 전용 외부 저장소라 마운트 시 1회 동기화가 정당한 useEffect 용도다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = window.sessionStorage.getItem(AI_MATERIAL_EMAIL_DRAFT_KEY);
    if (!raw) return;
    window.sessionStorage.removeItem(AI_MATERIAL_EMAIL_DRAFT_KEY);
    try {
      const draft = JSON.parse(raw) as AiMaterialEmailDraft;
      setRecipients(draft.recipients);
      // 주소만 말하고 제목·내용·자료를 따로 지정하지 않았으면 기본 안내문·전체
      // 자료 선택을 그대로 쓴다 — AI가 빈 값으로 덮어써서 기본값이 사라지지
      // 않게 한다(사용자 확인, 2026-08-26).
      if (draft.subject) setSubject(draft.subject);
      if (draft.message) setMessage(draft.message);
      if (draft.fileNameHints.length > 0) {
        const hints = draft.fileNameHints.map((h) => h.toLowerCase()).filter(Boolean);
        const matched = files.filter((f) => hints.some((h) => f.name.toLowerCase().includes(h)));
        if (matched.length > 0) setSelected(new Set(matched.map((f) => f.id)));
      }
      setAiNotice(true);
    } catch {
      // 초안 파싱 실패 시 조용히 무시하고 빈 폼으로 둔다.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

  const documents = useMemo(() => filtered.filter((f) => !isVideoFile(f)), [filtered]);
  const videos = useMemo(() => filtered.filter(isVideoFile), [filtered]);

  const selectedQuotation = quotations.find((q) => q.id === quotationId) ?? null;

  // 미리보기는 실제 발송(app/dashboard/actions/materialEmail.ts)과 같은
  // buildMaterialEmailHtml을 그대로 써서 항상 같은 결과가 보이게 한다 — 단,
  // 구글드라이브 실제 공유 링크(ensureFileShared)는 발송 시점에만 만들기 때문에
  // 미리보기에서는 자리표시 링크(#)를 쓴다(사용자 확인, 2026-08-28).
  const previewHtml = useMemo(() => {
    const selectedFiles = files.filter((f) => selected.has(f.id));
    return buildMaterialEmailHtml({
      subject: subject || "(제목 없음)",
      message: message || "(안내 내용 없음)",
      senderName: senderName || "-",
      senderTitle,
      senderEmail: senderEmail || "-",
      documents: selectedFiles.filter((f) => !isVideoFile(f)).map((f) => ({ name: f.name, link: "#" })),
      videos: selectedFiles.filter(isVideoFile).map((f) => ({ name: f.name, link: "#" })),
      quotation: selectedQuotation
        ? { quoteNumber: selectedQuotation.quoteNumber, customerName: selectedQuotation.customerName, printUrl: "#" }
        : null,
      productLinks: productLinkLabels.map((p) => ({ label: p.label, link: p.matched ? "#" : null })),
    });
  }, [files, selected, subject, message, senderName, senderTitle, senderEmail, selectedQuotation, productLinkLabels]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(group: DriveMaterialFile[], selectAll: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const f of group) {
        if (selectAll) next.add(f.id);
        else next.delete(f.id);
      }
      return next;
    });
  }

  return (
    <form
      action={formAction}
      onSubmit={() => {
        // 성공 시 새 발송을 위해 선택 상태를 기본값(전체 선택)으로 되돌린다
        // (실패 시에는 재시도하기 편하게 방금 선택 상태를 유지).
        if (state?.success) {
          setSelected(new Set(files.map((f) => f.id)));
          setQuotationId(null);
        }
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="quotationId" value={quotationId ?? ""} />

      {aiNotice && (
        <p className="rounded-sm border border-primary/30 bg-canvas-lavender/40 px-3 py-2 text-xs text-primary">
          AI 명령 입력창에서 넘어온 내용으로 미리 채웠습니다 — 내용을 확인하고 직접 보내주세요.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="recipients" className="text-sm font-medium text-ink">
          받는 사람 이메일 (쉼표 또는 줄바꿈으로 여러 명 입력)
        </label>
        <textarea
          id="recipients"
          name="recipients"
          required
          rows={2}
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="example@company.com, another@company.com"
          className="rounded border border-hairline bg-canvas-cream px-3 py-2 text-sm text-ink outline-none focus:border-primary"
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
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded border border-hairline bg-canvas-cream px-3 py-2 text-sm text-ink outline-none focus:border-primary"
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="보내드리는 자료에 대한 안내 문구를 입력하세요."
          className="rounded border border-hairline bg-canvas-cream px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <QuotationPicker quotations={quotations} value={quotationId} onChange={setQuotationId} />
      <p className="text-xs text-ink-mute">
        산출내역을 첨부하면 메일에 &ldquo;견적 및 제품자료 안내&rdquo; 섹션(견적서 원본 PDF 링크 포함)이 자동으로
        추가됩니다. 첨부하지 않으면 이 섹션은 메일에 표시되지 않습니다.
      </p>

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
            className="w-48 rounded border border-hairline bg-canvas-cream px-2 py-1 text-xs text-ink outline-none focus:border-primary"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="rounded-sm border border-hairline p-4 text-center text-sm text-ink-mute">
            {files.length === 0 ? "자료 폴더가 비어 있습니다." : "검색 결과가 없습니다."}
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="max-h-72 flex-1 overflow-auto rounded-sm border border-hairline bg-canvas-cream">
              <FileGroup title="보낼 문서" files={documents} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
            </div>
            <div className="max-h-72 flex-1 overflow-auto rounded-sm border border-hairline bg-canvas-cream">
              <FileGroup title="보낼 영상" files={videos} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-sm border border-hairline bg-canvas-cream p-3 text-xs text-ink-mute">
        <span className="font-semibold text-ink">회사 및 제품소개 자료</span>({productLinkLabels.filter((p) => p.matched).length}/
        {productLinkLabels.length}개 연결됨)는 메일 본문에 템플릿 형태로 항상 포함됩니다 — 아래 목록에 있는 이름과
        일치하는 파일이 자료 폴더에 있으면 자동으로 링크가 걸립니다.
        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {productLinkLabels.map((p) => (
            <li key={p.label} className={p.matched ? "text-ink" : "text-ink-mute line-through"}>
              {p.label}
            </li>
          ))}
        </ul>
      </div>

      {state?.error && <p className="text-sm text-semantic-error">{state.error}</p>}
      {state?.success && <p className="text-sm text-semantic-success">메일을 발송했습니다.</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="w-fit rounded-full border border-hairline px-6 py-2 text-sm font-bold text-ink hover:bg-[#f7f7f8]"
        >
          미리보기
        </button>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
        >
          {pending ? "발송 중..." : "보내기"}
        </button>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-sm font-bold text-ink">메일 미리보기</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="미리보기 닫기"
                className="text-ink-mute hover:text-ink"
              >
                ✕
              </button>
            </div>
            <iframe title="메일 미리보기" srcDoc={previewHtml} className="h-[75vh] w-full border-0" />
          </div>
        </div>
      )}
    </form>
  );
}
