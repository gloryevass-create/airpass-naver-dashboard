import { requireAuthedClient } from "@/lib/supabase/authed";
import { getProductCatalog } from "@/lib/queries/productCatalog";
import { getVendors } from "@/lib/queries/vendors";
import { ProductCatalogTable } from "@/components/dashboard/ProductCatalogTable";
import { NavIcon } from "@/components/icons/NavIcon";

export default async function ProductCatalogPage() {
  const { supabase } = await requireAuthedClient();
  const [products, vendors] = await Promise.all([getProductCatalog(supabase), getVendors(supabase)]);

  return (
    <main className="flex w-full flex-col gap-6 p-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-mute">Product Catalog</span>
        <h1 className="mt-0.5 flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <NavIcon name="tag" className="h-5 w-5" />
          제품 카탈로그
        </h1>
        <p className="mt-1 text-sm text-ink-mute">
          에어패스 제품 목록 — 단가·수수료율/마진율·조달 식별정보를 관리합니다. 팀원 누구나
          추가·수정할 수 있습니다.
        </p>
      </div>

      <ProductCatalogTable
        products={products}
        vendors={vendors.map((v) => ({ id: v.id, companyName: v.companyName }))}
      />
    </main>
  );
}
