import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type DisabilityOrganization = {
  id: string;
  groupName: string;
  provinceName: string | null;
  districtName: string | null;
  roadAddress: string | null;
  lotAddress: string | null;
  foundationDate: string | null;
  memberCount: number | null;
  phoneNumber: string | null;
  representativeName: string | null;
  referenceDate: string | null;
  providerOrgCode: string | null;
  providerOrgName: string | null;
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
      .from("disability_organizations")
      .select("*")
      .order("province_name", { ascending: true })
      .order("group_name", { ascending: true });
    return data ?? [];
  },
  ["disability-organizations"],
  { revalidate: 3600 }
);

export async function getDisabilityOrganizations(): Promise<DisabilityOrganization[]> {
  const data = await getCachedRows();

  return data.map((o) => ({
    id: o.id,
    groupName: o.group_name,
    provinceName: o.province_name,
    districtName: o.district_name,
    roadAddress: o.road_address,
    lotAddress: o.lot_address,
    foundationDate: o.foundation_date,
    memberCount: o.member_count,
    phoneNumber: o.phone_number,
    representativeName: o.representative_name,
    referenceDate: o.reference_date,
    providerOrgCode: o.provider_org_code,
    providerOrgName: o.provider_org_name,
    syncedAt: o.synced_at,
  }));
}
