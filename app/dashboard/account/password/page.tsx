import "@/components/industryTheme.css";
import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const { user } = await requireAuthedClient();

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", minHeight: "auto" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link
          href="/dashboard/events2"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--color-accent-700)",
            fontSize: 13,
            textDecoration: "none",
            marginBottom: "var(--space-5)",
          }}
        >
          ← 대시보드
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7.5" cy="15.5" r="4.5" />
            <path d="M10.8 12.2L20 3" />
            <path d="M16 7l3 3M13 10l2.5 2.5" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>비밀번호 변경</h1>
        </div>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
          보안을 위해 주기적으로 비밀번호를 변경해 주세요.
        </p>

        <ChangePasswordForm email={user.email ?? ""} />
      </div>
    </div>
  );
}
