import { requireAuthedClient } from "@/lib/supabase/authed";
import { getVendors } from "@/lib/queries/vendors";
import { VendorManager } from "@/components/dashboard/VendorManager";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function VendorsPage() {
  const { supabase } = await requireAuthedClient();
  const vendors = await getVendors(supabase);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Partner Vendor</span>
        <h1 className="mt-0.5 flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="wallet" className="h-5 w-5" />
          협력사 관리
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          사업자등록증·통장 사본·명함을 올리면 AI가 업체 정보를 자동으로 읽어 채워줍니다.
        </p>
      </div>

      <VendorManager vendors={vendors} />
    </main>
  );
}
