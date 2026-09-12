"use client";

import { useActionState, useState, useTransition, type CSSProperties } from "react";
import { updateOwnProfile, type UpdateProfileState } from "@/app/dashboard/actions/profile";
import {
  saveMaterialEmailSmtpAccount,
  deleteMaterialEmailSmtpAccount,
  type SmtpAccountState,
} from "@/app/dashboard/actions/smtpAccount";
import { FONT_OPTIONS, PRETENDARD_DEFAULT_STACK, type FontPreferenceId } from "@/lib/fontPreferences";

const initialState: UpdateProfileState = undefined;
const initialSmtpState: SmtpAccountState = undefined;

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

/** 자료메일발송 개인 SMTP 계정 등록/해제(2026-09-13) — 등록해두면 자료메일발송이
 * 공용 계정 대신 이 계정으로 보내고, 비밀번호는 절대 다시 채워 보여주지 않는다
 * (보안 — 서버가 클라이언트로 내려보내지도 않음). updateOwnProfile과는 별개
 * 액션이라 독립된 폼 + 저장 버튼으로 뒀다. */
function SmtpAccountSection({ smtpUser }: { smtpUser: string | null }) {
  const [state, formAction, pending] = useActionState(saveMaterialEmailSmtpAccount, initialSmtpState);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    if (!window.confirm("본인 SMTP 계정을 삭제하고 공용 계정으로 되돌릴까요?")) return;
    startDelete(async () => {
      await deleteMaterialEmailSmtpAccount();
    });
  }

  return (
    <div style={{ marginTop: "var(--space-8)", paddingTop: "var(--space-6)", borderTop: "1px solid var(--color-divider)" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, margin: "0 0 var(--space-2)" }}>자료메일발송 SMTP 계정</h2>
      <p className="text-muted" style={{ fontSize: 12, margin: "0 0 var(--space-4)" }}>
        {smtpUser
          ? `현재 본인 계정(${smtpUser})으로 발송됩니다.`
          : "등록해두면 자료메일발송이 공용 계정 대신 본인 계정으로 보냅니다. 등록하지 않으면 지금처럼 공용 계정으로 발송됩니다."}
        메일 서버(호스트·포트)는 공용과 동일하고, 이메일·비밀번호만 개인별입니다.
      </p>
      <form action={formAction} style={{ maxWidth: 640 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
          <div className="field">
            <label htmlFor="smtpUser">SMTP 계정 이메일</label>
            <input
              className="input"
              id="smtpUser"
              name="smtpUser"
              type="email"
              defaultValue={smtpUser ?? ""}
              placeholder="example@airpass.co.kr"
            />
          </div>
          <div className="field">
            <label htmlFor="smtpPassword">SMTP 비밀번호</label>
            <input
              className="input"
              id="smtpPassword"
              name="smtpPassword"
              type="password"
              placeholder={smtpUser ? "변경하지 않으려면 비워두세요" : "비밀번호 입력"}
              autoComplete="new-password"
            />
          </div>
        </div>
        {state?.error && (
          <p style={{ color: "var(--color-accent-900)", fontSize: 13, marginBottom: "var(--space-3)" }}>{state.error}</p>
        )}
        {state?.success && (
          <p style={{ color: "var(--color-accent-700)", fontSize: 13, marginBottom: "var(--space-3)" }}>저장되었습니다.</p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
          {smtpUser && (
            <button type="button" className="btn btn-secondary" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "삭제 중..." : "기본 계정으로 되돌리기"}
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
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
  smtpUser,
}: {
  name: string | null;
  companyEmail: string;
  title: string;
  googleEmail: string;
  phone: string;
  fontPreference: FontPreferenceId;
  sidebarFontPreference: FontPreferenceId;
  smtpUser: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateOwnProfile, initialState);
  // 폰트 두 필드만 컨트롤드로 관리한다 — 저장 전 실시간 미리보기를 그리려면
  // 현재 선택값을 리액트 상태로 알아야 한다(나머지 필드는 그대로 defaultValue).
  const [selectedFont, setSelectedFont] = useState<FontPreferenceId>(fontPreference);
  const [selectedSidebarFont, setSelectedSidebarFont] = useState<FontPreferenceId>(sidebarFontPreference);

  return (
    <>
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
    <SmtpAccountSection smtpUser={smtpUser} />
    </>
  );
}
