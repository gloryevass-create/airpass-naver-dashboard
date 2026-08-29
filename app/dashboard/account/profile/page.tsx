import "@/components/industryTheme.css";
import Link from "next/link";
import { requireAuthedClient } from "@/lib/supabase/authed";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const { supabase, user } = await requireAuthedClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

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
            <circle cx="12" cy="8" r="3.5" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>회원정보 수정</h1>
        </div>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
          직급과 구글메일을 수정할 수 있습니다.
        </p>

        <ProfileForm
          name={profile?.name ?? null}
          companyEmail={profile?.email ?? user.email ?? ""}
          title={profile?.title ?? ""}
          googleEmail={profile?.google_email ?? ""}
        />
      </div>
    </div>
  );
}
