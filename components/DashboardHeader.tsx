"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavIcon } from "@/components/icons/NavIcon";
import { AppLogo } from "@/components/icons/AppLogo";

export function DashboardHeader({
  email,
  isAdmin,
  latestDate,
}: {
  email: string;
  isAdmin: boolean;
  latestDate: string | null;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-hairline bg-background px-6 py-4">
      <div className="flex items-center gap-2.5">
        <AppLogo className="h-8 w-8" />
        <div>
          <h1 className="text-lg font-bold tracking-tight text-primary">
            Strategic Planning Team AGENT
          </h1>
          <p className="text-xs text-ink-mute">
            {latestDate ? `최근 수집일: ${latestDate}` : "아직 수집된 데이터가 없습니다"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-ink-mute">{email}</span>
        {isAdmin && (
          <a
            href="/admin"
            className="flex items-center gap-1 text-link-blue hover:text-link-hover hover:underline"
          >
            <NavIcon name="shield" className="h-3.5 w-3.5" />
            관리자
          </a>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 text-link-blue hover:text-link-hover hover:underline"
        >
          <NavIcon name="logout" className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>
    </header>
  );
}
