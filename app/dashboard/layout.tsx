import { requireAuthedClient } from "@/lib/supabase/authed";
import { getLatestDataDate } from "@/lib/queries/dashboard";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAuthedClient();

  const [{ data: profile }, latestDate] = await Promise.all([
    supabase.from("profiles").select("role, name, title").eq("id", user.id).single(),
    getLatestDataDate(supabase),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader
        email={user.email ?? ""}
        name={profile?.name ?? null}
        title={profile?.title ?? null}
        isAdmin={profile?.role === "admin"}
        latestDate={latestDate}
      />
      <div className="flex flex-1">
        <DashboardSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
