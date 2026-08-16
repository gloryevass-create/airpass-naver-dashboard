import { requireAdminClient } from "@/lib/supabase/authed";
import { InviteUserForm } from "@/components/InviteUserForm";

export default async function AdminPage() {
  const { supabase } = await requireAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">관리자 — 팀원 초대</h1>
        <p className="mt-1 text-sm text-neutral-500">
          공개 회원가입은 꺼져 있습니다. 이메일 초대로만 계정이 생성됩니다.
        </p>
      </div>

      <section>
        <InviteUserForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">가입자 목록</h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">이메일</th>
                <th className="px-4 py-2 font-medium">역할</th>
                <th className="px-4 py-2 font-medium">가입일</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2">{p.email}</td>
                  <td className="px-4 py-2">{p.role}</td>
                  <td className="px-4 py-2 text-neutral-500">
                    {new Date(p.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
              {(!profiles || profiles.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                    아직 가입자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
