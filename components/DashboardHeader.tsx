"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavIcon } from "@/components/icons/NavIcon";
import { AppLogo } from "@/components/icons/AppLogo";
import { formatMember } from "@/lib/formatMember";

export function DashboardHeader({
  email,
  name,
  title,
  isAdmin,
  latestDate,
}: {
  email: string;
  name: string | null;
  title: string | null;
  isAdmin: boolean;
  latestDate: string | null;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex flex-col gap-1.5 border-b border-white/10 bg-[#262b3a] px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/events" className="flex w-56 shrink-0 items-center gap-2.5">
          <AppLogo className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight tracking-tight text-white">
              Strategic Planning Team Business AGENT
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-white/70 transition-colors ${
                menuOpen ? "border-white/40 text-white" : "border-transparent hover:border-white/20 hover:text-white"
              }`}
            >
              <NavIcon name="user" className="h-3.5 w-3.5" />
              {formatMember(name, title, email)}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[10rem] rounded-md border border-hairline bg-background py-1 shadow-lg">
                <Link
                  href="/dashboard/account/password"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-canvas-cream"
                >
                  <NavIcon name="key" className="h-3.5 w-3.5" />
                  비밀번호 변경
                </Link>
              </div>
            )}
          </div>
          {isAdmin && (
            <a
              href="/dashboard/admin"
              className="flex items-center gap-1 text-white/70 hover:text-white hover:underline"
            >
              <NavIcon name="shield" className="h-3.5 w-3.5" />
              관리자
            </a>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-white/70 hover:text-white hover:underline"
          >
            <NavIcon name="logout" className="h-3.5 w-3.5" />
            로그아웃
          </button>
        </div>
      </div>
      <p className="text-right text-xs text-white/50">
        {latestDate ? `최근 수집일: ${latestDate}` : "아직 수집된 데이터가 없습니다"}
      </p>
    </header>
  );
}
