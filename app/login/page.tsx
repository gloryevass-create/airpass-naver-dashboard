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
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-logo.png" alt="Strategic Planning Team" className="h-16 w-auto" />
        </div>
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
