"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { WorkJournalEntry } from "@/lib/queries/workJournal";
import {
  createWorkJournalEntry,
  updateWorkJournalEntry,
  deleteWorkJournalEntry,
  deleteWorkJournalAttachment,
  getWorkJournalAttachmentUrls,
} from "@/app/dashboard/actions/workJournal";

// Business/Cooperation/Marketing과 같은 Claude Design "Industry" 테마를 그대로
// 적용했다(2026-08-29). 데이터·서버 액션은 기존 Work Journal 그대로, 화면만
// 새로 그렸다 — 새 메뉴를 만들지 않고 그 자리에서 다시 그린 것(Calendar와 동일한
// 방식). 목업의 **굵게**/~~취소선~~/체크박스 표시는 순수 렌더링 단계에서만
// 적용한다(저장되는 content는 그대로 평문).
const TOKEN_REGEX = /(\*\*.+?\*\*|~~.+?~~)/g;

type Token = { text: string; bold: boolean; strike: boolean };

function tokenizeLine(rawLine: string): Token[] {
  let text = rawLine;
  if (text.startsWith("- [x] ")) text = "☑ " + text.slice(6);
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((m = TOKEN_REGEX.exec(text))) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index), bold: false, strike: false });
    const seg = m[0];
    if (seg.startsWith("**")) tokens.push({ text: seg.slice(2, -2), bold: true, strike: false });
    else tokens.push({ text: seg.slice(2, -2), bold: false, strike: true });
    last = TOKEN_REGEX.lastIndex;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), bold: false, strike: false });
  if (tokens.length === 0) tokens.push({ text: "", bold: false, strike: false });
  return tokens;
}

function RenderLine({ line }: { line: string }) {
  return (
    <p style={{ margin: "0 0 6px", paddingLeft: "var(--space-3)", fontSize: 15, lineHeight: 1.65, minHeight: "1em" }}>
      {tokenizeLine(line).map((tok, i) =>
        tok.bold ? <b key={i}>{tok.text}</b> : tok.strike ? <s key={i}>{tok.text}</s> : <span key={i}>{tok.text}</span>
      )}
    </p>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function isImage(contentType: string | null): boolean {
  return Boolean(contentType?.startsWith("image/"));
}

/* ─────────────────────────── 작성/수정 폼(인라인 카드) ─────────────────────────── */

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
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !pending && !state?.error) onDone();
    wasPendingRef.current = pending;
  }, [pending, state, onDone]);

  return (
    <div className="card blueprint elev-md" style={{ marginBottom: "var(--space-6)", padding: "var(--space-6) var(--space-8)", background: "#ffffff" }}>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      <div className="card-kicker">{entry ? "일지 수정" : "새 일지 작성"}</div>
      <form action={formAction} style={{ marginTop: "var(--space-3)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)" }}>
          <div className="field">
            <label>작성자 *</label>
            <select className="input" name="authorName" required defaultValue={entry?.authorName ?? ""}>
              <option value="" disabled>
                선택
              </option>
              {members.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>주차 라벨</label>
            <input className="input" name="weekLabel" placeholder="예: 26년 02월 1~2주차" defaultValue={entry?.weekLabel ?? ""} />
          </div>
          <div className="field">
            <label>날짜</label>
            <input className="input" type="date" name="entryDate" defaultValue={entry?.entryDate ?? ""} />
          </div>
        </div>
        <div className="field" style={{ marginTop: "var(--space-3)" }}>
          <label>내용 *</label>
          <textarea className="input" name="content" required rows={5} defaultValue={entry?.content ?? ""} />
        </div>
        <div className="field" style={{ marginTop: "var(--space-3)" }}>
          <label>파일첨부</label>
          <input
            className="input"
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          />
          <p className="text-muted" style={{ fontSize: 12, margin: "var(--space-1) 0 0" }}>
            이미지·PDF·Office 문서·ZIP, 파일당 12MB 이하, 최대 5개
          </p>
          {entry && entry.attachments.length > 0 && (
            <p className="text-muted" style={{ fontSize: 12, margin: "var(--space-1) 0 0" }}>
              기존 첨부파일은 상세 화면에서 개별적으로 삭제할 수 있습니다.
            </p>
          )}
        </div>
        {state?.error && <p style={{ color: "var(--color-accent-900)", fontSize: 13, marginTop: "var(--space-2)" }}>{state.error}</p>}
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          <button type="submit" className="btn btn-primary blueprint" disabled={pending}>
            <i className="corner tl" />
            <i className="corner tr" />
            <i className="corner bl" />
            <i className="corner br" />
            {pending ? "저장 중..." : entry ? "수정 저장" : "일지 추가"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onDone}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────── 첨부파일 ─────────────────────────── */

function AttachmentList({ entry }: { entry: WorkJournalEntry }) {
  const [urls, setUrls] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function load() {
    if (urls || loading) return;
    setLoading(true);
    const result = await getWorkJournalAttachmentUrls(entry.attachments.map((a) => a.storagePath));
    setUrls(result);
    setLoading(false);
  }

  function handleDelete(attachmentId: string) {
    if (!window.confirm("이 첨부파일을 삭제할까요?")) return;
    startTransition(() => {
      void deleteWorkJournalAttachment(attachmentId);
    });
  }

  if (entry.attachments.length === 0) return null;

  return (
    <div style={{ marginTop: "var(--space-2)", paddingLeft: "var(--space-3)" }}>
      <button type="button" className="btn btn-ghost" onClick={load} style={{ paddingInline: 0, fontSize: 12 }}>
        {loading ? "불러오는 중..." : urls ? `첨부파일 ${entry.attachments.length}개` : `첨부파일 ${entry.attachments.length}개 보기`}
      </button>
      {urls && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
          {entry.attachments.map((a) => {
            const url = urls[a.storagePath];
            return (
              <div
                key={a.id}
                className="tag tag-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {url ? (
                  isImage(a.contentType) ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={a.fileName} style={{ width: 16, height: 16, objectFit: "cover" }} />
                      <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.fileName}</span>
                    </a>
                  ) : (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📎 {a.fileName}
                    </a>
                  )
                ) : (
                  <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.fileName}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  style={{ background: "none", border: 0, padding: 0, color: "var(--color-accent-900)", cursor: "pointer", font: "inherit" }}
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

/* ─────────────────────────── 항목 카드 ─────────────────────────── */

function EntryCard({ entry, onEdit }: { entry: WorkJournalEntry; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const lines = useMemo(() => entry.content.split("\n"), [entry.content]);
  const hasMultipleLines = lines.length > 1;
  const displayLines = expanded ? lines : lines.slice(0, 1);

  function handleDelete() {
    if (!window.confirm("이 업무일지를 삭제하시겠습니까?")) return;
    startTransition(() => {
      void deleteWorkJournalEntry(entry.id);
    });
  }

  return (
    <div className="card blueprint elev-sm" style={{ marginBottom: "var(--space-4)", padding: "var(--space-5)", background: "#ffffff" }}>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", padding: "var(--space-2) 0", marginBottom: "var(--space-3)" }}>
        <span className="tag tag-accent">{entry.authorName}</span>
        {entry.weekLabel && <span className="tag tag-outline">{entry.weekLabel}</span>}
        <span className="text-muted" style={{ fontSize: 13 }}>
          {formatDate(entry.entryDate)}
        </span>
        {entry.attachments.length > 0 && (
          <span className="tag tag-neutral" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            {entry.attachments.length}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {hasMultipleLines && (
          <button type="button" className="btn btn-ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "접기 ▲" : "펼치기 ▼"}
          </button>
        )}
        <button type="button" className="btn btn-secondary blueprint" onClick={onEdit}>
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />
          수정
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleDelete}>
          삭제
        </button>
      </div>
      {displayLines.map((line, i) => (
        <RenderLine key={i} line={line} />
      ))}
      {expanded && <AttachmentList entry={entry} />}
    </div>
  );
}

/* ─────────────────────────── 메인 보드 ─────────────────────────── */

export function IndustryWorkJournalBoard({ entries, members }: { entries: WorkJournalEntry[]; members: string[] }) {
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
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>Work Journal</h1>
      </div>
      <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
        팀원별 주차 업무일지를 관리합니다(Notion 연동 없음 — 이 시스템이 원본입니다).
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-6)" }}>
        <div className="seg" style={{ flexWrap: "wrap", background: "#ffffff" }}>
          {authors.map((a) => (
            <button
              key={a}
              type="button"
              className={`seg-opt${authorFilter === a ? " active" : ""}`}
              style={{ border: 0 }}
              onClick={() => {
                setAuthorFilter(a);
                setEditingId(null);
              }}
            >
              {a}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary blueprint" onClick={() => setEditingId("new")}>
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 일지 추가
        </button>
      </div>

      {editingId === "new" && <EntryForm entry={null} members={members} onDone={() => setEditingId(null)} />}
      {editingEntry && <EntryForm entry={editingEntry} members={members} onDone={() => setEditingId(null)} />}

      {filtered.length === 0 ? (
        <div className="card blueprint" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />
          <p className="text-muted" style={{ margin: 0 }}>
            등록된 업무일지가 없습니다.
          </p>
        </div>
      ) : (
        filtered.map((e) => <EntryCard key={e.id} entry={e} onEdit={() => setEditingId(e.id)} />)
      )}
    </div>
  );
}
