import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function SetPasswordPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    redirect(
      `/login?message=${encodeURIComponent("먼저 초대/재설정 링크로 인증해주세요.")}`
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">비밀번호 설정</h1>
        <p className="mt-1 text-sm text-neutral-500">
          계속 사용할 새 비밀번호를 입력하세요.
        </p>
      </div>
      <SetPasswordForm />
    </main>
  );
}
