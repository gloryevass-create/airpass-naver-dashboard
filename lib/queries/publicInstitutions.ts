import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicInstitution = {
  id: string;
  siteName: string;
  institutionType: string | null;
  institutionCategory: string | null;
  detailCategory: string | null;
  siteType: string | null;
  url: string | null;
  syncedAt: string;
};

// 하루 한 번만 파이프라인이 통째로 교체하는 참고용 스냅샷이라 요청마다 새로 조회할
// 필요가 없다 — unstable_cache(1시간 재검증)로 재방문 시 Supabase 왕복을 없앤다.
// 캐시된 조회는 요청자별 RLS 세션과 무관한 공용 데이터라 admin(service_role)
// 클라이언트로 수행한다(페이지 자체는 이미 requireAuthedClient()로 인증 게이트를
// 거친 뒤에만 이 함수를 호출한다).
const getCachedRows = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("public_institutions")
      .select("*")
      .order("institution_type", { ascending: true })
      .order("site_name", { ascending: true });
    return data ?? [];
  },
  ["public-institutions"],
  { revalidate: 3600 }
);

export async function getPublicInstitutions(): Promise<PublicInstitution[]> {
  const data = await getCachedRows();

  return data.map((i) => ({
    id: i.id,
    siteName: i.site_name,
    institutionType: i.institution_type,
    institutionCategory: i.institution_category,
    detailCategory: i.detail_category,
    siteType: i.site_type,
    url: i.url,
    syncedAt: i.synced_at,
  }));
}
