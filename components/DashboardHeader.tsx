"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold">에어패스 네이버 마케팅 모니터링</h1>
        <p className="text-xs text-neutral-500">
          {latestDate ? `최근 수집일: ${latestDate}` : "아직 수집된 데이터가 없습니다"}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-neutral-500">{email}</span>
        {isAdmin && (
          <a href="/admin" className="text-neutral-700 hover:underline">
            관리자
          </a>
        )}
        <button onClick={handleSignOut} className="text-neutral-700 hover:underline">
          로그아웃
        </button>
      </div>
    </header>
  );
}
