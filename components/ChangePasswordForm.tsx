"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          style={{ paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 표시"}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: 0,
            cursor: "pointer",
            color: "var(--color-text)",
            opacity: 0.55,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {show ? (
              <>
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.85 21.85 0 0 1-2.61 3.94M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="M1 1l22 22" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordForm({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setPending(true);
    const supabase = createClient();

    // 현재 세션이 유효해도 비밀번호 변경 전 현재 비밀번호를 재확인한다(자리 비운 사이
    // 남이 접근하는 경우 방지).
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) {
      setError("현재 비밀번호가 올바르지 않습니다.");
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
      setPending(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <PasswordField
        id="current-password"
        label="현재 비밀번호"
        autoComplete="current-password"
        value={currentPassword}
        onChange={setCurrentPassword}
      />
      <PasswordField
        id="new-password"
        label="새 비밀번호"
        autoComplete="new-password"
        value={newPassword}
        onChange={setNewPassword}
      />
      <PasswordField
        id="confirm-password"
        label="새 비밀번호 확인"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
      {error && <p style={{ color: "var(--color-accent-900)", fontSize: 13 }}>{error}</p>}
      {success && <p style={{ color: "var(--color-accent-700)", fontSize: 13 }}>비밀번호가 변경되었습니다.</p>}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
