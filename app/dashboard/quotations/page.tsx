import { requireAuthedClient } from "@/lib/supabase/authed";
import { getQuotations, getBusinessProjectOptions } from "@/lib/queries/quotations";
import { getTeamMemberNames } from "@/lib/queries/teamMembers";
import { getProductCatalog } from "@/lib/queries/productCatalog";
import { QuotationBoard } from "@/components/dashboard/QuotationBoard";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function QuotationsPage() {
  const { supabase } = await requireAuthedClient();
  const [quotations, members, products, businessProjects] = await Promise.all([
    getQuotations(supabase),
    getTeamMemberNames(supabase),
    getProductCatalog(supabase),
    getBusinessProjectOptions(supabase),
  ]);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Quotation</p>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-ink">
          <NavIcon name="receipt" className="h-5 w-5 text-primary" />
          산출내역 작성·보관
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          제품 카탈로그 정보로 산출내역을 작성·수정·삭제하고 인쇄용 화면으로 출력합니다.
        </p>
      </div>
      <QuotationBoard quotations={quotations} members={members} products={products} businessProjects={businessProjects} />
    </main>
  );
}
