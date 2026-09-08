"use client";

import { useActionState } from "react";
import { updateOwnProfile, type UpdateProfileState } from "@/app/dashboard/actions/profile";

const initialState: UpdateProfileState = undefined;

// 본문 폰트/사이드바 폰트 두 드롭다운이 같은 선택지를 쓴다(2026-09-08, 사이드바
// 별도 설정 추가) — 옵션 목록을 여기 한 곳에만 두고 재사용한다.
const FONT_OPTIONS = [
  { value: "pretendard", label: "Pretendard (기본)" },
  { value: "system", label: "시스템 기본 폰트" },
  { value: "gmarket", label: "G마켓 산스" },
  { value: "nanumsquare", label: "나눔스퀘어" },
  { value: "noto", label: "본고딕 (Noto Sans KR)" },
  { value: "omudaye", label: "오뮤 다예쁨체" },
] as const;

type FontPreference = (typeof FONT_OPTIONS)[number]["value"];

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
  fontPreference: FontPreference;
  sidebarFontPreference: FontPreference;
}) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, initialState);

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
        <div className="field">
          <label htmlFor="fontPreference">본문 폰트</label>
          <select className="input" id="fontPreference" name="fontPreference" defaultValue={fontPreference}>
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sidebarFontPreference">사이드바 폰트</label>
          <select
            className="input"
            id="sidebarFontPreference"
            name="sidebarFontPreference"
            defaultValue={sidebarFontPreference}
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: "0 0 var(--space-5)" }}>
        이름·회사메일·역할은 관리자만 변경할 수 있습니다. 폰트는 본인 화면에만 적용되며, 산출내역
        인쇄본·고객 공개 페이지에는 영향을 주지 않습니다. 본문 폰트와 사이드바 폰트는 서로 다르게
        고를 수 있습니다.
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
