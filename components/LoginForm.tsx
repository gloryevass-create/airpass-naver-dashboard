"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavIcon } from "@/components/icons/NavIcon";
import { recordLogin } from "@/app/login/actions";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setPending(false);
      return;
    }

    // 로그인 기록 실패가 로그인 자체를 막으면 안 되므로 별도로 감싼다.
    await recordLogin().catch(() => {});

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-hairline px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          비밀번호
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-hairline px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-mute hover:text-ink"
          >
            <NavIcon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-semantic-error">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white hover:bg-primary-press disabled:opacity-50"
      >
        {pending ? "로그인 중..." : "로그인"}
      </button>
      <a
        href="/auth/forgot-password"
        className="text-center text-sm text-link-blue hover:text-link-hover hover:underline"
      >
        비밀번호를 잊으셨나요?
      </a>
    </form>
  );
}
