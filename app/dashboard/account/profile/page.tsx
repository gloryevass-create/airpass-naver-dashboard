import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { ProfileForm } from "@/components/ProfileForm";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function ProfilePage() {
  const { supabase, user } = await requireAuthedClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <Link
        href="/dashboard/events2"
        className="flex items-center gap-1 text-sm text-ink-mute hover:text-ink"
      >
        ← 대시보드
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="user" className="h-5 w-5" />
          회원정보 수정
        </h1>
        <p className="mt-1 text-sm text-ink-mute">직급과 구글메일을 수정할 수 있습니다.</p>
      </div>

      <div className="rounded-sm border border-hairline bg-canvas-cream p-6">
        <ProfileForm
          name={profile?.name ?? null}
          companyEmail={profile?.email ?? user.email ?? ""}
          title={profile?.title ?? ""}
          googleEmail={profile?.google_email ?? ""}
        />
      </div>
    </main>
  );
}
