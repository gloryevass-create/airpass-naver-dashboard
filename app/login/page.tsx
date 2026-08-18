import { LoginForm } from "@/components/LoginForm";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AppLogo } from "@/components/icons/AppLogo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <AppLogo className="h-9 w-9" />
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Strategic Planning Team AGENT
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink-mute">팀 계정으로 로그인하세요.</p>
      </div>
      {isSupabaseConfigured ? (
        <LoginForm redirectTo={redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard/events"} />
      ) : (
        <SetupNotice />
      )}
    </main>
  );
}
