import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function ChangePasswordPage() {
  const { user } = await requireAuthedClient();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Link
        href="/dashboard/events"
        className="flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
      >
        ← 대시보드
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="key" className="h-5 w-5" />
          비밀번호 변경
        </h1>
        <p className="mt-1 text-sm text-ink-mute">보안을 위해 주기적으로 비밀번호를 변경해 주세요.</p>
      </div>

      <div className="rounded-sm border border-hairline p-6">
        <ChangePasswordForm email={user.email ?? ""} />
      </div>
    </main>
  );
}
