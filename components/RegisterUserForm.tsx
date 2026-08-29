"use client";

import { useActionState, useState } from "react";
import { registerUser, type RegisterState } from "@/app/dashboard/admin/actions";

const initialState: RegisterState = undefined;

export function RegisterUserForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);
  const [role, setRole] = useState<"member" | "guest">("member");

  return (
    <form action={formAction} style={{ maxWidth: 640 }}>
      <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 var(--space-3)" }}>
        팀원 등록
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <div className="field">
          <label htmlFor="reg-name">이름 *</label>
          <input className="input" id="reg-name" name="name" placeholder="홍길동" required />
        </div>
        <div className="field">
          <label htmlFor="reg-title">직함</label>
          <input className="input" id="reg-title" name="title" placeholder="팀장" />
        </div>
        <div className="field">
          <label htmlFor="reg-email">회사메일 *</label>
          <input className="input" id="reg-email" name="email" type="email" placeholder="teammate@airpass.co.kr" required />
        </div>
        <div className="field">
          <label htmlFor="reg-google-email">구글메일</label>
          <input className="input" id="reg-google-email" name="googleEmail" type="email" placeholder="teammate@gmail.com" />
        </div>
        <div className="field">
          <label id="reg-role-label">역할</label>
          <div className="seg" role="radiogroup" aria-labelledby="reg-role-label">
            <label className={`seg-opt${role === "member" ? " active" : ""}`}>
              <input
                type="radio"
                name="role"
                value="member"
                checked={role === "member"}
                onChange={() => setRole("member")}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              member
            </label>
            <label className={`seg-opt${role === "guest" ? " active" : ""}`}>
              <input
                type="radio"
                name="role"
                value="guest"
                checked={role === "guest"}
                onChange={() => setRole("guest")}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              guest
            </label>
          </div>
        </div>
      </div>
      {state?.error && (
        <p style={{ color: "var(--color-accent-900)", fontSize: 13, marginBottom: "var(--space-3)" }}>{state.error}</p>
      )}
      {state?.success && (
        <p style={{ color: "var(--color-accent-700)", fontSize: 13, marginBottom: "var(--space-3)" }}>{state.success}</p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}
