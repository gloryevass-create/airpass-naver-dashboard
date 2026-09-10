"use client";

import { useActionState, useState, type CSSProperties } from "react";
import { updateOwnProfile, type UpdateProfileState } from "@/app/dashboard/actions/profile";
import { FONT_OPTIONS, PRETENDARD_DEFAULT_STACK, type FontPreferenceId } from "@/lib/fontPreferences";

const initialState: UpdateProfileState = undefined;

const PREVIEW_TEXT = "가나다 ABC 123 — 실제 이 폰트로 보입니다";

function fontStackFor(id: FontPreferenceId): string {
  return FONT_OPTIONS.find((opt) => opt.id === id)?.stack ?? PRETENDARD_DEFAULT_STACK;
}

/** 드롭다운에 적힌 이름만 봐서는 실제 어떤 폰트가 적용된 건지 알 수 없다는
 * 피드백(2026-09-10)으로 추가 — 선택을 바꿀 때마다(저장 전에도) 그 폰트의 실제
 * font-family로 렌더링되는 샘플 문구를 보여준다. */
function FontPreview({ fontId }: { fontId: FontPreferenceId }) {
  return (
    <p style={{ margin: "6px 0 0", fontSize: 13, fontFamily: fontStackFor(fontId) } as CSSProperties}>
      {PREVIEW_TEXT}
    </p>
  );
}

export function ProfileForm({
  name,
  companyEmail,
  title,
  googleEmail,
  phone,
  fontPreference,
  sidebarFontPreference,
}: {
  name: string | null;
  companyEmail: string;
  title: string;
  googleEmail: string;
  phone: string;
  fontPreference: FontPreferenceId;
  sidebarFontPreference: FontPreferenceId;
}) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, initialState);
  // 폰트 두 필드만 컨트롤드로 관리한다 — 저장 전 실시간 미리보기를 그리려면
  // 현재 선택값을 리액트 상태로 알아야 한다(나머지 필드는 그대로 defaultValue).
  const [selectedFont, setSelectedFont] = useState<FontPreferenceId>(fontPreference);
  const [selectedSidebarFont, setSelectedSidebarFont] = useState<FontPreferenceId>(sidebarFontPreference);

  return (
    <form action={formAction} style={{ maxWidth: 640 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
        <div className="field">
          <label>이름</label>
          <input className="input" value={name ?? "-"} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
        </div>
        <div className="field">
          <label>회사메일</label>
          <input className="input" value={companyEmail} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
        </div>
        <div className="field">
          <label htmlFor="title">직급</label>
          <input className="input" id="title" name="title" defaultValue={title} placeholder="예: 팀장" />
        </div>
        <div className="field">
          <label htmlFor="googleEmail">구글메일</label>
          <input className="input" id="googleEmail" name="googleEmail" type="email" defaultValue={googleEmail} placeholder="example@gmail.com" />
        </div>
        <div className="field">
          <label htmlFor="phone">핸드폰번호</label>
          <input className="input" id="phone" name="phone" type="tel" defaultValue={phone} placeholder="010-1234-5678" />
        </div>
        <div />
        <div className="field">
          <label htmlFor="fontPreference">본문 폰트</label>
          <select
            className="input"
            id="fontPreference"
            name="fontPreference"
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value as FontPreferenceId)}
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <FontPreview fontId={selectedFont} />
        </div>
        <div className="field">
          <label htmlFor="sidebarFontPreference">사이드바 폰트</label>
          <select
            className="input"
            id="sidebarFontPreference"
            name="sidebarFontPreference"
            value={selectedSidebarFont}
            onChange={(e) => setSelectedSidebarFont(e.target.value as FontPreferenceId)}
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <FontPreview fontId={selectedSidebarFont} />
        </div>
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: "0 0 var(--space-5)" }}>
        이름·회사메일·역할은 관리자만 변경할 수 있습니다. 폰트는 본인 화면에만 적용되며, 산출내역
        인쇄본·고객 공개 페이지에는 영향을 주지 않습니다. 본문 폰트와 사이드바 폰트는 서로 다르게
        고를 수 있습니다. 드롭다운 아래 문구가 실제 그 폰트로 미리 보여집니다.
      </p>
      {state?.error && (
        <p style={{ color: "var(--color-accent-900)", fontSize: 13, marginBottom: "var(--space-3)" }}>{state.error}</p>
      )}
      {state?.success && (
        <p style={{ color: "var(--color-accent-700)", fontSize: 13, marginBottom: "var(--space-3)" }}>저장되었습니다.</p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
