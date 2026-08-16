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
        <h1 className="text-xl font-semibold">에어패스 네이버 마케팅 모니터링</h1>
        <p className="mt-1 text-sm text-neutral-500">팀 계정으로 로그인하세요.</p>
      </div>
      {isSupabaseConfigured ? (
        <LoginForm redirectTo={redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"} />
      ) : (
        <SetupNotice />
      )}
    </main>
  );
}
