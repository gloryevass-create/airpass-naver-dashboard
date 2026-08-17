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
        <h1 className="text-xl font-bold tracking-tight text-primary">
          AIRPASS MAKETING AGNENT
        </h1>
        <p className="mt-1 text-sm text-ink-mute">팀 계정으로 로그인하세요.</p>
      </div>
      {isSupabaseConfigured ? (
        <LoginForm redirectTo={redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"} />
      ) : (
        <SetupNotice />
      )}
    </main>
  );
}
