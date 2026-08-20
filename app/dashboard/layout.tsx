import { requireAuthedClient } from "@/lib/supabase/authed";
import { getLatestDataDate } from "@/lib/queries/dashboard";
import { getNotifications } from "@/lib/queries/notifications";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { MobileNavProvider } from "@/components/MobileNavContext";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAuthedClient();

  const [{ data: profile }, latestDate, notifications] = await Promise.all([
    supabase.from("profiles").select("role, name, title").eq("id", user.id).single(),
    getLatestDataDate(),
    getNotifications(supabase, user.id),
  ]);

  return (
    <MobileNavProvider>
      <div className="flex flex-1 flex-col">
        <DashboardHeader
          email={user.email ?? ""}
          name={profile?.name ?? null}
          title={profile?.title ?? null}
          isAdmin={profile?.role === "admin"}
          userId={user.id}
          notifications={notifications}
        />
        <div className="flex flex-1 overflow-x-hidden">
          <DashboardSidebar latestDate={latestDate} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </MobileNavProvider>
  );
}
