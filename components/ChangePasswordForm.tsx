"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NavIcon } from "@/components/icons/NavIcon";

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
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-hairline px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "비밀번호 숨기기" : "비밀번호 표시"}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-mute hover:text-ink"
        >
          <NavIcon name={show ? "eyeOff" : "eye"} className="h-4 w-4" />
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
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
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
      {error && <p className="text-sm text-semantic-error">{error}</p>}
      {success && <p className="text-sm text-semantic-success">비밀번호가 변경되었습니다.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
