import { requireAuthedClient } from "@/lib/supabase/authed";
import { getQuotations } from "@/lib/queries/quotations";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { getProductCatalog } from "@/lib/queries/productCatalog";
import { QuotationBoard } from "@/components/dashboard/QuotationBoard";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function QuotationsPage() {
  const { supabase } = await requireAuthedClient();
  const [quotations, members, products] = await Promise.all([
    getQuotations(supabase),
    getTeamMemberNames(supabase),
    getProductCatalog(supabase),
  ]);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="receipt" className="h-5 w-5" />
          견적서 관리
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          이 화면에서 직접 견적서를 작성·수정·삭제하고 인쇄용 화면으로 출력합니다.
        </p>
      </div>
      <QuotationBoard quotations={quotations} members={members} products={products} />
    </main>
  );
}
