import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

export type SeniorWelfareFacility = {
  id: string;
  facilityName: string;
  facilityType: string | null;
  provinceName: string | null;
  roadAddress: string | null;
  lotAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  businessStatus: string | null;
  phoneNumber: string | null;
  managingOrgName: string | null;
  providingInstName: string | null;
  referenceDate: string | null;
  syncedAt: string;
};

// 전국 약 3.5만 건 규모라 Supabase/PostgREST 기본 응답 상한(1000행)에 걸린다 —
// province_name으로 정렬해서 가져오면 사전순으로 가장 앞선 지역(강원특별자치도) 안에서만
// 1000건이 채워져 다른 지역이 아예 안 보이는 문제가 있었다(실측 확인, 2026-08-20).
// range()로 전체를 페이지네이션해서 받는다.
const PAGE_SIZE = 1000;

export async function getSeniorWelfareFacilities(supabase: Client): Promise<SeniorWelfareFacility[]> {
  const rows: Database["public"]["Tables"]["senior_welfare_facilities"]["Row"][] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data } = await supabase
      .from("senior_welfare_facilities")
      .select("*")
      .order("province_name", { ascending: true })
      .order("facility_name", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return rows.map((f) => ({
    id: f.id,
    facilityName: f.facility_name,
    facilityType: f.facility_type,
    provinceName: f.province_name,
    roadAddress: f.road_address,
    lotAddress: f.lot_address,
    latitude: f.latitude,
    longitude: f.longitude,
    businessStatus: f.business_status,
    phoneNumber: f.phone_number,
    managingOrgName: f.managing_org_name,
    providingInstName: f.providing_inst_name,
    referenceDate: f.reference_date,
    syncedAt: f.synced_at,
  }));
}
