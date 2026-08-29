import "@/components/industryTheme.css";
import { requireAdminClient } from "@/lib/supabase/authed";
import { RegisterUserForm } from "@/components/RegisterUserForm";

export default async function AdminPage() {
  const { supabase } = await requireAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      {/* 팀원 등록 영역만 Claude Design "관리자 페이지 디자인" 목업을 적용했다
          (2026-08-29) — 아래 "가입자 목록" 표는 그대로 유지(사용자 확인, "표는 제외"). */}
      <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)", minHeight: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5.5c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5V6z" />
              <path d="M9 12l2 2 4-4.5" />
            </svg>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>관리자 — 팀원 등록</h1>
          </div>
          <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-6)", fontSize: 13 }}>
            공개 회원가입은 꺼져 있습니다. 여기서 계정을 등록하면 즉시 로그인할 수 있습니다.
          </p>

          <RegisterUserForm />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">가입자 목록</h2>
          <div className="overflow-x-auto rounded-sm border border-hairline bg-canvas-cream">
            <table className="w-full text-sm">
              <thead className="bg-canvas-cream text-left text-ink-mute">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">이름</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">직함</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">회사메일</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">구글메일</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">역할</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">가입일</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">최근 로그인</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium">접속 IP</th>
                </tr>
              </thead>
              <tbody>
                {(profiles ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-hairline">
                    <td className="whitespace-nowrap px-4 py-2">{p.name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{p.title ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{p.email}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{p.google_email ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-2">{p.role}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">
                      {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">
                      {p.last_login_at ? new Date(p.last_login_at).toLocaleString("ko-KR") : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-mute">{p.last_login_ip ?? "-"}</td>
                  </tr>
                ))}
                {(!profiles || profiles.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-ink-mute">
                      아직 가입자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
