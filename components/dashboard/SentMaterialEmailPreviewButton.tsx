"use client";

import { useState } from "react";
import { getSentMaterialEmailHtml } from "@/app/dashboard/actions/materialEmail";

// MaterialEmailForm.tsx의 "미리보기" 다이얼로그와 같은 UX(사용자 요청, 2026-09-03 —
// 원래는 별도 페이지로 이동하는 방식이었는데 미리보기창 형태로 바꿔달라고 함).
// 다만 저기는 이미 만들어둔 HTML을 즉시 그리고, 여기는 이력에서 서버 액션으로
// 그 순간의 메일 본문을 재구성해 와야 해서 로딩 상태가 있다는 점만 다르다.
export function SentMaterialEmailPreviewButton({ logId, subject }: { logId: string; subject: string }) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setOpen(true);
    if (html || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getSentMaterialEmailHtml(logId);
      if (!result) setError("발송 이력을 찾을 수 없습니다.");
      else setHtml(result);
    } catch {
      setError("메일 내용을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          fontWeight: 600,
          color: "var(--color-accent-700)",
          textDecoration: "underline",
          background: "none",
          border: 0,
          padding: 0,
          font: "inherit",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {subject}
      </button>

      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div
            className="dialog"
            style={{ width: "min(960px,96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, background: "#ffffff" }}
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
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 15 }}>보낸 메일 보기</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="미리보기 닫기"
                className="btn btn-ghost"
                style={{ padding: "2px 8px" }}
              >
                ✕
              </button>
            </div>
            {loading && (
              <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
                <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
                  불러오는 중...
                </p>
              </div>
            )}
            {error && (
              <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-accent-900)" }}>{error}</p>
              </div>
            )}
            {html && <iframe title="보낸 메일 보기" srcDoc={html} style={{ height: "75vh", width: "100%", border: 0 }} />}
          </div>
        </div>
      )}
    </>
  );
}
