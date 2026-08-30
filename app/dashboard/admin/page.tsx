import "@/components/industryTheme.css";
import { requireAdminClient } from "@/lib/supabase/authed";
import { RegisterUserForm } from "@/components/RegisterUserForm";

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR");
}

// Claude Design "관리자 페이지 디자인" 목업을 페이지 전체(등록 폼 + 가입자 목록 표)에
// 적용했다(2026-08-29) — 처음에는 표만 기존 Tailwind 스타일로 남겨뒀는데, 두 스타일이
// 섞이면서 레이아웃이 깨지는 문제가 있어(등록 폼 영역의 min-height:100vh가 표를 화면
// 밖으로 밀어냄) 전체를 하나의 .industry-theme로 통일했다(사용자 확인).
export default async function AdminPage() {
  const { supabase } = await requireAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="industry-theme" style={{ padding: "var(--space-8) var(--space-6)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v5.5c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5V6z" />
            <path d="M9 12l2 2 4-4.5" />
          </svg>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 28, margin: 0, color: "var(--color-accent-700)" }}>관리자 — 팀원 등록</h1>
        </div>
        <p className="text-muted" style={{ margin: "var(--space-2) 0 var(--space-8)", fontSize: 13 }}>
          공개 회원가입은 꺼져 있습니다. 여기서 계정을 등록하면 즉시 로그인할 수 있습니다.
        </p>

        <RegisterUserForm />

        <div style={{ marginTop: "var(--space-9)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55, margin: "0 0 var(--space-3)" }}>
            가입자 목록
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>직함</th>
                  <th>회사메일</th>
                  <th>구글메일</th>
                  <th>핸드폰번호</th>
                  <th>역할</th>
                  <th>가입일</th>
                  <th>최근 로그인</th>
                  <th>접속 IP</th>
                </tr>
              </thead>
              <tbody>
                {(profiles ?? []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name ?? "-"}</td>
                    <td className="text-muted">{p.title ?? "-"}</td>
                    <td className="text-muted">{p.email}</td>
                    <td className="text-muted">{p.google_email ?? "-"}</td>
                    <td className="text-muted">{p.phone ?? "-"}</td>
                    <td>
                      <span
                        className={
                          p.role === "admin" ? "tag tag-accent" : p.role === "guest" ? "tag tag-neutral" : "tag tag-outline"
                        }
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(p.created_at).toLocaleDateString("ko-KR")}</td>
                    <td className="text-muted">{formatDateTime(p.last_login_at)}</td>
                    <td className="text-muted">{p.last_login_ip ?? "-"}</td>
                  </tr>
                ))}
                {(!profiles || profiles.length === 0) && (
                  <tr>
                    <td colSpan={9} className="text-muted" style={{ textAlign: "center", padding: "var(--space-6)" }}>
                      아직 가입자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
