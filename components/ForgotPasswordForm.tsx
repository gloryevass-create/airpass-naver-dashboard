"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setPending(false);
    if (error) {
      setError("요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="max-w-sm text-center text-sm text-ink-mute">
        입력하신 이메일로 재설정 링크를 보냈습니다. 메일함을 확인해주세요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          이메일
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      {error && <p className="text-sm text-semantic-error">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "전송 중..." : "재설정 링크 보내기"}
      </button>
    </form>
  );
}
