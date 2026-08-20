"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NavIcon } from "@/components/icons/NavIcon";
import { AppLogo } from "@/components/icons/AppLogo";
import { NotificationBell } from "@/components/NotificationBell";
import { useMobileNav } from "@/components/MobileNavContext";
import { formatMember } from "@/lib/formatMember";
import type { Notification } from "@/lib/queries/notifications";

export function DashboardHeader({
  email,
  name,
  title,
  isAdmin,
  userId,
  notifications,
}: {
  email: string;
  name: string | null;
  title: string | null;
  isAdmin: boolean;
  userId: string;
  notifications: Notification[];
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toggle: toggleMobileNav } = useMobileNav();

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
    <header className="flex items-center justify-between border-b border-white/10 bg-[#262b3a] px-4 py-4 md:px-6">
      <div className="flex min-w-0 items-center gap-1 md:w-56 md:shrink-0 md:gap-2.5">
        <button
          type="button"
          onClick={toggleMobileNav}
          aria-label="메뉴 열기"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-white/70 hover:text-white md:hidden"
        >
          <NavIcon name="menu" className="h-5 w-5" />
        </button>
        <Link href="/dashboard/events" className="flex min-w-0 items-center gap-2.5">
          <AppLogo className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight tracking-tight text-white">
              Strategic Planning Team Business AGENT
            </h1>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-2 text-sm md:gap-4">
        <NotificationBell initialNotifications={notifications} userId={userId} />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-white/70 transition-colors md:px-3 ${
              menuOpen ? "border-white/40 text-white" : "border-transparent hover:border-white/20 hover:text-white"
            }`}
          >
            <NavIcon name="user" className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{formatMember(name, title, email)}</span>
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
            <span className="hidden md:inline">관리자</span>
          </a>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 text-white/70 hover:text-white hover:underline"
        >
          <NavIcon name="logout" className="h-3.5 w-3.5" />
          <span className="hidden md:inline">로그아웃</span>
        </button>
      </div>
    </header>
  );
}
