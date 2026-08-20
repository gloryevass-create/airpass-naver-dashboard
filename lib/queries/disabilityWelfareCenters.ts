import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type DisabilityWelfareCenter = {
  id: string;
  facilityName: string;
  facilityType: string | null;
  provinceName: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  operatingStatus: string | null;
  establishmentDate: string | null;
  welfareFacilityId: string | null;
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
      .from("disability_welfare_centers")
      .select("*")
      .order("province_name", { ascending: true })
      .order("facility_name", { ascending: true });
    return data ?? [];
  },
  ["disability-welfare-centers"],
  { revalidate: 3600 }
);

export async function getDisabilityWelfareCenters(): Promise<DisabilityWelfareCenter[]> {
  const data = await getCachedRows();

  return data.map((c) => ({
    id: c.id,
    facilityName: c.facility_name,
    facilityType: c.facility_type,
    provinceName: c.province_name,
    roadAddress: c.road_address,
    latitude: c.latitude != null ? Number(c.latitude) : null,
    longitude: c.longitude != null ? Number(c.longitude) : null,
    operatingStatus: c.operating_status,
    establishmentDate: c.establishment_date,
    welfareFacilityId: c.welfare_facility_id,
    syncedAt: c.synced_at,
  }));
}
