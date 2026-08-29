"use client";

import { useActionState } from "react";
import { updateOwnProfile, type UpdateProfileState } from "@/app/dashboard/actions/profile";

const initialState: UpdateProfileState = undefined;

export function ProfileForm({
  name,
  companyEmail,
  title,
  googleEmail,
}: {
  name: string | null;
  companyEmail: string;
  title: string;
  googleEmail: string;
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
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: "0 0 var(--space-5)" }}>
        이름·회사메일·역할은 관리자만 변경할 수 있습니다.
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
