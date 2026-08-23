import { LoginForm } from "@/components/LoginForm";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="w-full max-w-sm text-center">
        {/* 로그인 폼(LoginForm)과 같은 max-w-sm 폭에 맞춘다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-logo.png" alt="Strategic Planning Team" className="mb-3 h-auto w-full" />
        <p className="mt-1 text-sm text-ink-mute">팀 계정으로 로그인하세요.</p>
      </div>
      {isSupabaseConfigured ? (
        <LoginForm redirectTo={redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard/events2"} />
      ) : (
        <SetupNotice />
      )}
    </main>
  );
}
