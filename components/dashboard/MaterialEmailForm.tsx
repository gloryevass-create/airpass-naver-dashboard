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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px var(--space-3)",
          fontSize: 12,
          fontWeight: 600,
          color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
          background: "var(--color-surface)",
        }}
      >
        <input
          type="checkbox"
          checked={allSelected}
          disabled={files.length === 0}
          onChange={() => onToggleAll(files, !allSelected)}
          style={{ width: 14, height: 14, flex: "none", accentColor: "var(--color-accent)" }}
        />
        {title} ({files.length}) 전체 선택
      </label>
      {files.length === 0 && (
        <p className="text-muted" style={{ padding: "var(--space-4) 0", textAlign: "center", fontSize: 13 }}>
          해당 없음
        </p>
      )}
      {files.map((f) => (
        <label
          key={f.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid var(--color-divider)",
            padding: "var(--space-2) var(--space-3)",
            fontSize: 13,
            cursor: "pointer",
            background: selected.has(f.id) ? "var(--color-accent-100)" : undefined,
          }}
        >
          <input
            type="checkbox"
            name="fileIds"
            value={f.id}
            checked={selected.has(f.id)}
            onChange={() => onToggle(f.id)}
            style={{ width: 14, height: 14, flex: "none", accentColor: "var(--color-accent)" }}
          />
          {f.iconLink && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.iconLink} alt="" style={{ width: 16, height: 16, flex: "none" }} />
          )}
          <span style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.name}>
            {f.name}
          </span>
          <span className="text-muted" style={{ flex: "none", fontSize: 11 }}>
            {formatFileSize(f.sizeBytes)}
          </span>
        </label>
      ))}
    </div>
  );
}

/** 산출내역(견적) 첨부 검색 — 최대 1건만 첨부한다(템플릿에 "견적서 원본 PDF"
 * 자리가 하나뿐이라 단일 선택). */
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
    <div ref={panelRef} className="field" style={{ position: "relative" }}>
      <label>산출내역(견적) 첨부 — 선택 안 함</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-secondary"
          style={{ minWidth: 0, flex: 1, justifyContent: "flex-start", overflow: "hidden" }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            🔍 {selected ? `${selected.quoteNumber} · ${selected.customerName}` : `산출내역 검색 (${quotations.length}건)`}
          </span>
        </button>
        {selected && (
          <button type="button" onClick={() => onChange(null)} aria-label="첨부 해제" className="btn btn-ghost" style={{ flex: "none" }}>
            ✕
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            zIndex: 20,
            marginTop: 4,
            maxHeight: 256,
            width: "100%",
            overflowY: "auto",
            border: "1px solid var(--color-divider)",
            background: "#ffffff",
            textAlign: "left",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid var(--color-divider)",
              background: "#ffffff",
              padding: "var(--space-2) var(--space-3)",
            }}
          >
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="기관명·산출번호로 검색"
              className="input"
              style={{ minWidth: 0, flex: 1, fontSize: 12, minHeight: 30 }}
            />
            <button type="button" onClick={() => setOpen(false)} className="btn btn-primary" style={{ flex: "none", fontSize: 11, minHeight: 30, padding: "0 10px" }}>
              선택 완료
            </button>
          </div>
          {filtered.length === 0 ? (
            <p className="text-muted" style={{ padding: "var(--space-4) var(--space-3)", textAlign: "center", fontSize: 12 }}>
              검색 결과가 없습니다.
            </p>
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
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  borderTop: "1px solid var(--color-divider)",
                  borderLeft: 0,
                  borderRight: 0,
                  borderBottom: 0,
                  padding: "var(--space-2) var(--space-3)",
                  textAlign: "left",
                  background: q.id === value ? "var(--color-accent-100)" : "transparent",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700 }}>
                  {q.quoteNumber} · {q.customerName}
                </span>
                <span className="text-muted" style={{ flex: "none", fontSize: 10 }}>
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
  senderPhone,
}: {
  files: DriveMaterialFile[];
  quotations: QuotationSummary[];
  productLinkLabels: { label: string; matched: boolean }[];
  senderName: string;
  senderTitle: string | null;
  senderEmail: string;
  senderPhone: string | null;
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
      senderPhone,
      logoUrl: "/airpass-logo.png",
      documents: selectedFiles.filter((f) => !isVideoFile(f)).map((f) => ({ name: f.name, link: "#" })),
      videos: selectedFiles.filter(isVideoFile).map((f) => ({ name: f.name, link: "#" })),
      quotation: selectedQuotation
        ? { quoteNumber: selectedQuotation.quoteNumber, customerName: selectedQuotation.customerName, printUrl: "#" }
        : null,
      productLinks: productLinkLabels.map((p) => ({ label: p.label, link: p.matched ? "#" : null })),
    });
  }, [files, selected, subject, message, senderName, senderTitle, senderEmail, senderPhone, selectedQuotation, productLinkLabels]);

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
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
    >
      <input type="hidden" name="quotationId" value={quotationId ?? ""} />

      {aiNotice && (
        <p
          style={{
            border: "1px solid var(--color-divider)",
            background: "var(--color-accent-100)",
            padding: "var(--space-2) var(--space-3)",
            fontSize: 12,
            color: "var(--color-accent-800)",
          }}
        >
          AI 명령 입력창에서 넘어온 내용으로 미리 채웠습니다 — 내용을 확인하고 직접 보내주세요.
        </p>
      )}
      <div className="field">
        <label htmlFor="recipients">받는 사람 이메일 (쉼표 또는 줄바꿈으로 여러 명 입력)</label>
        <textarea
          id="recipients"
          name="recipients"
          required
          rows={2}
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="example@company.com, another@company.com"
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="subject">제목</label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="message">안내 내용</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="보내드리는 자료에 대한 안내 문구를 입력하세요."
          className="input"
        />
      </div>

      <QuotationPicker quotations={quotations} value={quotationId} onChange={setQuotationId} />
      <p className="text-muted" style={{ fontSize: 12, marginTop: -8 }}>
        산출내역을 첨부하면 메일에 &ldquo;견적 및 제품자료 안내&rdquo; 섹션(견적서 원본 PDF 링크 포함)이 자동으로
        추가됩니다. 첨부하지 않으면 이 섹션은 메일에 표시되지 않습니다.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            보낼 자료 선택 {selected.size > 0 && `(${selected.size}개 선택됨)`}
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="자료명 검색"
            className="input"
            style={{ width: 192, fontSize: 12, minHeight: 30 }}
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-muted" style={{ border: "1px solid var(--color-divider)", padding: "var(--space-4)", textAlign: "center", fontSize: 13 }}>
            {files.length === 0 ? "자료 폴더가 비어 있습니다." : "검색 결과가 없습니다."}
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ maxHeight: 288, flex: "1 1 280px", overflow: "auto", border: "1px solid var(--color-divider)" }}>
              <FileGroup title="보낼 문서" files={documents} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
            </div>
            <div style={{ maxHeight: 288, flex: "1 1 280px", overflow: "auto", border: "1px solid var(--color-divider)" }}>
              <FileGroup title="보낼 영상" files={videos} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
            </div>
          </div>
        )}
      </div>

      <div style={{ border: "1px solid var(--color-divider)", padding: "var(--space-3)", fontSize: 12 }} className="text-muted">
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>회사 및 제품소개 자료</span>(
        {productLinkLabels.filter((p) => p.matched).length}/{productLinkLabels.length}개 연결됨)는 메일 본문에 템플릿
        형태로 항상 포함됩니다 — 아래 목록에 있는 이름과 일치하는 파일이 자료 폴더에 있으면 자동으로 링크가
        걸립니다.
        <ul style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "8px 12px", padding: 0, listStyle: "none" }}>
          {productLinkLabels.map((p) => (
            <li key={p.label} style={p.matched ? { color: "var(--color-text)" } : { textDecoration: "line-through" }}>
              {p.label}
            </li>
          ))}
        </ul>
      </div>

      {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{state.error}</p>}
      {state?.success && <p style={{ color: "var(--color-accent-700)", fontSize: 13 }}>메일을 발송했습니다.</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <button type="button" onClick={() => setPreviewOpen(true)} className="btn btn-secondary">
          미리보기
        </button>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "발송 중..." : "보내기"}
        </button>
      </div>

      {previewOpen && (
        <div className="dialog-backdrop" onClick={() => setPreviewOpen(false)}>
          <div
            className="dialog"
            style={{ width: "min(1240px,96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, background: "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--color-divider)",
                padding: "var(--space-3) var(--space-4)",
              }}
            >
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15 }}>메일 미리보기</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="미리보기 닫기"
                className="btn btn-ghost"
                style={{ padding: "2px 8px" }}
              >
                ✕
              </button>
            </div>
            <iframe title="메일 미리보기" srcDoc={previewHtml} style={{ height: "75vh", width: "100%", border: 0 }} />
          </div>
        </div>
      )}
    </form>
  );
}
