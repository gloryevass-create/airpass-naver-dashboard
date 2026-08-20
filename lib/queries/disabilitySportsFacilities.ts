import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type DisabilitySportsFacility = {
  id: string;
  facilityName: string;
  provinceName: string | null;
  districtName: string | null;
  operatingBody: string | null;
  phoneNumber: string | null;
  homepageUrl: string | null;
  hasVoucherProgram: boolean | null;
  hasBandabiFacility: boolean | null;
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
      .from("disability_sports_facilities")
      .select("*")
      .order("province_name", { ascending: true })
      .order("facility_name", { ascending: true });
    return data ?? [];
  },
  ["disability-sports-facilities"],
  { revalidate: 3600 }
);

export async function getDisabilitySportsFacilities(): Promise<DisabilitySportsFacility[]> {
  const data = await getCachedRows();

  return data.map((f) => ({
    id: f.id,
    facilityName: f.facility_name,
    provinceName: f.province_name,
    districtName: f.district_name,
    operatingBody: f.operating_body,
    phoneNumber: f.phone_number,
    homepageUrl: f.homepage_url,
    hasVoucherProgram: f.has_voucher_program,
    hasBandabiFacility: f.has_bandabi_facility,
    syncedAt: f.synced_at,
  }));
}
